; Inno Setup script para gerar o instalador .exe do ACS Gestão Geral
; Instala os arquivos, executa o script de configuração, cria atalho e inicia o serviço abrindo o navegador

[Setup]
AppName=ACS Gestão Geral
AppVersion=1.0.0
DefaultDirName={pf}\ACS Gestao Geral
DefaultGroupName=ACS Gestão Geral
DisableDirPage=no
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=ACS_Gestao_Geral_Installer
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: recursesubdirs

[Icons]
Name: "{commondesktop}\ACS Gestão Geral"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\installer\start_service.vbs"""; WorkingDir: "{app}"
Name: "{group}\Iniciar ACS Gestão Geral"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\installer\start_service.vbs"""; WorkingDir: "{app}"
Name: "{group}\Desinstalar ACS Gestão Geral"; Filename: "{uninstallexe}"

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\install.ps1"""; Flags: runhidden; StatusMsg: "Configurando dependências e preparando o sistema..."
Filename: "{app}\installer\start_service.bat"; Description: "Iniciar ACS Gestão Geral"; Flags: postinstall runminimized nowait; StatusMsg: "Inicializando serviço e abrindo o navegador..."
