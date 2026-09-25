param(
  [string]$Repo = "C:\Users\Admin\Downloads\servos"
)

$ErrorActionPreference = "Stop"
$File = Join-Path $Repo "src\native\EnrollmentView.tsx"

if (!(Test-Path $File)) {
  throw "EnrollmentView.tsx not found at $File"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "$File.$stamp.bak"
Copy-Item $File $backup -Force

$text = Get-Content $File -Raw
$old = "if (!profile || !ready) {"
$new = "if (!profile || !business || !owner || !admin || !ready) {"

if ($text.Contains($old)) {
  $text = $text.Replace($old, $new)
  Set-Content -Path $File -Value $text -Encoding UTF8
  Write-Host "Fixed EnrollmentView TypeScript narrowing."
  Write-Host "Backup: $backup"
} elseif ($text.Contains($new)) {
  Write-Host "Fix is already present."
} else {
  throw "Expected guard not found. Inspect $File manually before applying."
}

Write-Host ""
Write-Host "Run:"
Write-Host "  cd $Repo"
Write-Host "  npm run lint"
Write-Host "  npm run verify"
