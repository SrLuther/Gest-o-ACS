Param(
  [string]$ProjectRoot = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\\.."
)
Write-Host "Iniciando instalação do ACS Gestão Geral..." -ForegroundColor Cyan
function Initialize-NodeRuntime {
  try {
    $nodeVer = node -v
    Write-Host "Node já instalado: $nodeVer" -ForegroundColor Green
  } catch {
    Write-Host "Node não encontrado. Baixando instalador..." -ForegroundColor Yellow
    $url = "https://nodejs.org/dist/v18.19.1/node-v18.19.1-x64.msi"
    $msi = "$env:TEMP\\node-setup.msi"
    Invoke-WebRequest -Uri $url -OutFile $msi
    Write-Host "Instalando Node..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$msi`" /qn"
  }
}
function Invoke-ProjectSetup {
  Push-Location $ProjectRoot
  Write-Host "Instalando dependências backend e frontend..." -ForegroundColor Cyan
  node setup.js
  Write-Host "Gerando build do frontend..." -ForegroundColor Cyan
  Push-Location "$ProjectRoot\\frontend"
  npm run build
  Pop-Location
  Pop-Location
}
function New-DesktopShortcut {
  $shell = New-Object -ComObject WScript.Shell
  $desktop = [Environment]::GetFolderPath("Desktop")
  $targetExe = "$env:SystemRoot\\System32\\wscript.exe"
  $targetVbs = "$ProjectRoot\\installer\\start_service.vbs"
  $shortcut = $shell.CreateShortcut("$desktop\\ACS Gestão Geral.lnk")
  $shortcut.TargetPath = $targetExe
  $shortcut.Arguments = "`"$targetVbs`""
  $shortcut.WorkingDirectory = "$ProjectRoot"
  $shortcut.IconLocation = "$ProjectRoot\\frontend\\public\\favicon.ico,0"
  $shortcut.Save()
  Write-Host "Atalho criado na área de trabalho." -ForegroundColor Green
}
function Register-BackendTask {
  try {
    Write-Host "Registrando tarefa agendada para iniciar backend no logon..." -ForegroundColor Cyan
    $wsExe = "$env:SystemRoot\\System32\\wscript.exe"
    $svcScript = "$ProjectRoot\\installer\\start_service.vbs"
    $cmdLogon = "`"$wsExe`" `"$svcScript`""
    $cmdStartup = $cmdLogon
    $null = schtasks /Create /TN "ACSBackendLogon" /SC ONLOGON /TR $cmdLogon /RL HIGHEST /F /RU "$env:UserName"
    $null = schtasks /Create /TN "ACSBackendStartup" /SC ONSTART /TR $cmdStartup /RL HIGHEST /F /RU "SYSTEM"
  } catch {
    Write-Host "Falha ao registrar tarefa agendada. O backend ainda pode ser iniciado pelo atalho." -ForegroundColor Yellow
  }
}
Initialize-NodeRuntime
Invoke-ProjectSetup
New-DesktopShortcut
Register-BackendTask
Write-Host "Instalação concluída. Use o atalho 'ACS Gestão Geral' para iniciar." -ForegroundColor Green
