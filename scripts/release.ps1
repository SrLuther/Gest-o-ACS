Param(
  [Parameter(Mandatory=$true)][string]$Version
)
Write-Host "Atualizando versões para $Version..." -ForegroundColor Cyan
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Split-Path -Parent $root
function Update-Package {
  Param([string]$Path)
  $json = Get-Content $Path | ConvertFrom-Json
  $json.version = $Version
  $json | ConvertTo-Json -Depth 10 | Set-Content $Path -Encoding UTF8
}
Update-Package (Join-Path $project "backend\package.json")
Update-Package (Join-Path $project "frontend\package.json")
Write-Host "Comitando alterações..." -ForegroundColor Cyan
Push-Location $project
git config user.name "ACS Release Bot"
git config user.email "release@local"
git add backend\package.json frontend\package.json
git commit -m "chore: release v$Version"
git tag "v$Version"
Write-Host "Pronto. Para enviar: git push && git push --tags" -ForegroundColor Green
Pop-Location
