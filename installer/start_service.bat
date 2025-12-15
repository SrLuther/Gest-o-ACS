@echo off
setlocal
cd /d "%~dp0\.."
echo Iniciando serviço ACS Gestão Geral...
set "BACKEND_DIR=%~dp0..\backend"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'node' -ArgumentList 'index.js' -WorkingDirectory '%BACKEND_DIR%' -WindowStyle Hidden"
timeout /t 2 >nul
start "" http://localhost:3001/
echo Serviço iniciado. Esta janela pode ser fechada sem interromper o serviço.
endlocal
