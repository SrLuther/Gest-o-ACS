Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)
appRoot = fso.GetParentFolderName(scriptDir)
backendDir = fso.BuildPath(appRoot, "backend")
progFiles = CreateObject("WScript.Shell").ExpandEnvironmentStrings("%ProgramFiles%")
progFilesX86 = CreateObject("WScript.Shell").ExpandEnvironmentStrings("%ProgramFiles(x86)%")
nodePath = "node"
If fso.FileExists(progFiles & "\nodejs\node.exe") Then
  nodePath = progFiles & "\nodejs\node.exe"
ElseIf fso.FileExists(progFilesX86 & "\nodejs\node.exe") Then
  nodePath = progFilesX86 & "\nodejs\node.exe"
End If
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = backendDir
shell.Run Chr(34) & nodePath & Chr(34) & " index.js", 0, False
shell.Run "http://localhost:3001/", 1, False
