param([string]$Repo=(Get-Location).Path,[switch]$SkipTests)
$ErrorActionPreference='Stop'; Set-Location $Repo
Write-Host "ServOS Windows build: $Repo" -ForegroundColor Cyan
foreach($cmd in @('node','npm','rustc','cargo')){ if(-not (Get-Command $cmd -ErrorAction SilentlyContinue)){throw "$cmd is required"}}
if(-not (Test-Path '.env.local')){throw '.env.local is required for enrollment builds. Copy .env.example and configure the dedicated business Supabase project.'}
npm ci
if(-not $SkipTests){ npm run lint; npm test; npm run test:browser; npm run test:native }
npm run docs:check; npm run audit:ui; npm run build; npm run native:build
Write-Host 'Windows package complete. Inspect src-tauri\target\release\bundle.' -ForegroundColor Green
