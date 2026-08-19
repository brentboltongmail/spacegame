Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
psScript = scriptDir & "\restart_server.ps1"
WshShell.Run "powershell -NoProfile -ExecutionPolicy Bypass -File """ & psScript & """ -OpenBrowser", 0, False
