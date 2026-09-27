[CmdletBinding()]
param(
    [string]$Repo = (Split-Path -Parent $PSScriptRoot),
    [string]$OutputRoot = "",
    [switch]$SkipTests,
    [switch]$Msi,
    [switch]$AllowDirty
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Section([string]$Message) {
    Write-Host ''
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [Parameter(Mandatory)][string[]]$ArgumentList
    )
    Write-Host ('> {0} {1}' -f $FilePath, ($ArgumentList -join ' ')) -ForegroundColor DarkCyan
    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -Wait -PassThru -NoNewWindow
    if ($process.ExitCode -ne 0) {
        throw "$FilePath exited with code $($process.ExitCode)."
    }
}

$Repo = [IO.Path]::GetFullPath($Repo)
Set-Location -LiteralPath $Repo

foreach ($required in @(
    'package.json',
    'src-tauri\tauri.conf.json',
    'scripts\deploy-windows.ps1',
    'scripts\install-windows-pos.ps1',
    'scripts\servos-terminal-doctor.ps1',
    'scripts\run-terminal-tests.ps1'
)) {
    if (-not (Test-Path (Join-Path $Repo $required))) {
        throw "Missing required release file: $required"
    }
}

if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
    throw 'Git is required to produce a traceable terminal release.'
}

Write-Section 'Release source checkpoint'
$branch = (& git.exe branch --show-current).Trim()
$commit = (& git.exe rev-parse HEAD).Trim()
$shortCommit = (& git.exe rev-parse --short=10 HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or -not $commit) {
    throw 'Could not resolve the Git commit.'
}

$dirty = @(& git.exe status --porcelain)
if ($dirty.Count -gt 0 -and -not $AllowDirty) {
    Write-Host 'Working tree changes:' -ForegroundColor Yellow
    $dirty | ForEach-Object { Write-Host "  $_" }
    throw 'Refusing to build a terminal installer from a dirty working tree. Commit/stash changes or rerun explicitly with -AllowDirty.'
}
if ($dirty.Count -gt 0) {
    Write-Warning 'Building from a dirty working tree because -AllowDirty was supplied. The release manifest will record this.'
}

$package = Get-Content -LiteralPath (Join-Path $Repo 'package.json') -Raw | ConvertFrom-Json
$tauri = Get-Content -LiteralPath (Join-Path $Repo 'src-tauri\tauri.conf.json') -Raw | ConvertFrom-Json
if ($package.version -ne $tauri.version) {
    throw "package.json version $($package.version) does not match Tauri version $($tauri.version)."
}

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $Repo 'release'
}
$OutputRoot = [IO.Path]::GetFullPath($OutputRoot)
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

Write-Host "Branch:  $branch"
Write-Host "Commit:  $commit"
Write-Host "Version: $($tauri.version)"
Write-Host "Format:  $(if ($Msi) { 'MSI' } else { 'NSIS EXE' })"

Write-Section 'Validated Tauri package build'
$deployArgs = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $Repo 'scripts\deploy-windows.ps1'),
    '-Mode', 'Package',
    '-Repo', $Repo
)
if ($SkipTests) { $deployArgs += '-SkipTests' }
if ($Msi) { $deployArgs += '-Msi' }
Invoke-Checked -FilePath 'powershell.exe' -ArgumentList $deployArgs

$cargoTarget = Join-Path $Repo 'src-tauri\target'
if (-not [string]::IsNullOrWhiteSpace($env:CARGO_TARGET_DIR)) {
    $cargoTarget = [IO.Path]::GetFullPath($env:CARGO_TARGET_DIR)
}
$bundleRoot = Join-Path $cargoTarget 'release\bundle'
$installer = Get-ChildItem -LiteralPath $bundleRoot -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
        if ($Msi) { $_.Extension -eq '.msi' }
        else { $_.Extension -eq '.exe' -and $_.Name -match '(?i)setup' }
    } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $installer) {
    throw "No terminal installer was found under $bundleRoot after the Tauri build."
}

$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $installer.FullName).Hash.ToLowerInvariant()
$sidecar = $installer.FullName + '.sha256'
if (-not (Test-Path $sidecar)) {
    throw "The build completed but its SHA-256 sidecar is missing: $sidecar"
}
$expectedHash = ((Get-Content -LiteralPath $sidecar -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
if ($expectedHash -ne $actualHash) {
    throw 'Generated installer SHA-256 does not match its sidecar.'
}

$releaseName = "ServOS-Terminal-v$($tauri.version)-$shortCommit"
if ($Msi) { $releaseName += '-msi' } else { $releaseName += '-nsis' }
$releaseDir = Join-Path $OutputRoot $releaseName

if (Test-Path $releaseDir) {
    throw "Release folder already exists: $releaseDir. Remove it deliberately before rebuilding the same version/commit."
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null

Copy-Item -LiteralPath $installer.FullName -Destination $releaseDir
Copy-Item -LiteralPath $sidecar -Destination $releaseDir
Copy-Item -LiteralPath (Join-Path $Repo 'scripts\install-windows-pos.ps1') -Destination $releaseDir
Copy-Item -LiteralPath (Join-Path $Repo 'scripts\servos-terminal-doctor.ps1') -Destination $releaseDir
Copy-Item -LiteralPath (Join-Path $Repo 'scripts\run-terminal-tests.ps1') -Destination $releaseDir

$manifest = [ordered]@{
    Product = $tauri.productName
    Version = $tauri.version
    Identifier = $tauri.identifier
    GitBranch = $branch
    GitCommit = $commit
    GitDirty = ($dirty.Count -gt 0)
    BuiltAt = (Get-Date).ToUniversalTime().ToString('o')
    BundleFormat = if ($Msi) { 'msi' } else { 'nsis' }
    TestsSkipped = [bool]$SkipTests
    Installer = $installer.Name
    InstallerSha256 = $actualHash
    BuilderComputer = $env:COMPUTERNAME
    Architecture = $env:PROCESSOR_ARCHITECTURE
}
$manifestPath = Join-Path $releaseDir 'servos-terminal-release.json'
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$instructions = @"
ServOS Terminal Release
=======================
Version: $($tauri.version)
Commit:  $commit
Format:  $(if ($Msi) { 'MSI' } else { 'NSIS' })

FILES
-----
$($installer.Name)
$($installer.Name).sha256
servos-terminal-release.json
install-windows-pos.ps1
servos-terminal-doctor.ps1
run-terminal-tests.ps1

INSTALL
-------
1. Copy this entire folder to the target terminal.
2. Run the terminal preflight:
   powershell -ExecutionPolicy Bypass -File .\run-terminal-tests.ps1 -DeploymentFolder .
3. For an NSIS release, install with:
   powershell -ExecutionPolicy Bypass -File .\install-windows-pos.ps1 -InstallerPath ".\$($installer.Name)"
4. Launch ServOS and complete Business Admin > Physical terminal acceptance.

IMPORTANT
---------
No .env.local, Supabase key, SQLite database, backup, operator PIN, or other credential is included in this package.
"@
Set-Content -LiteralPath (Join-Path $releaseDir 'INSTALL.txt') -Value $instructions -Encoding UTF8

Write-Section 'Terminal release ready'
Write-Host "Folder:    $releaseDir" -ForegroundColor Green
Write-Host "Installer: $(Join-Path $releaseDir $installer.Name)"
Write-Host "SHA-256:   $actualHash"
Write-Host "Manifest:  $manifestPath"
if ($SkipTests) {
    Write-Warning 'This release was built with -SkipTests and must not be treated as release-verified.'
}
