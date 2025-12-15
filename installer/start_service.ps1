Write-Host "Iniciando ACS Gestão Geral..." -ForegroundColor Cyan
$AppRoot = (Get-Item $PSScriptRoot).Parent.FullName
$Backend = Join-Path $AppRoot "backend"
function Get-NodePath {
  $paths = @(
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles(x86)\nodejs\node.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { return $p }
  }
  try {
    $n = (Get-Command node).Source
    if ($n) { return $n }
  } catch {}
  return "node"
}
$nodePath = Get-NodePath
try {
  $existing = Get-Process -Name "node" -ErrorAction SilentlyContinue
} catch {
  $existing = $null
}
if (-not $existing) {
  Start-Process -FilePath $nodePath -ArgumentList "index.js" -WorkingDirectory $Backend -WindowStyle Hidden
}
Start-Process "http://localhost:3001/"
Write-Host "Backend iniciado e navegador aberto." -ForegroundColor Green
