# Solaris Horizon: Emergence - Taskbar Shortcut Generator
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

$ws = New-Object -ComObject WScript.Shell

# 1. Create Silent Taskbar-Ready Shortcut
$lnkPath = Join-Path $scriptDir "Solaris Horizon Server.lnk"
$shortcut = $ws.CreateShortcut($lnkPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$scriptDir\restart_server_silent.vbs`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Restart Solaris Horizon: Emergence 3D Space Game Server"
$shortcut.IconLocation = "shell32.dll,14" # Globe/Network icon
$shortcut.Save()

Write-Host "Created shortcut: $lnkPath" -ForegroundColor Green

# 2. Also copy shortcut to Desktop if Desktop exists
$desktop = [Environment]::GetFolderPath("Desktop")
if (Test-Path $desktop) {
    $desktopLnk = Join-Path $desktop "Solaris Horizon Server.lnk"
    Copy-Item -Path $lnkPath -Destination $desktopLnk -Force
    Write-Host "Copied shortcut to Desktop: $desktopLnk" -ForegroundColor Green
}
