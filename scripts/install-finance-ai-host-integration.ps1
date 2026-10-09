$ErrorActionPreference = 'Stop'

$protocolName = 'lizhi-finance-ai'
$protocolRoot = "HKCU:\Software\Classes\$protocolName"
$hostScript = Join-Path $PSScriptRoot 'start-finance-ai-host.ps1'
$windowLauncherScript = Join-Path $PSScriptRoot 'start-finance-ai-host-window.ps1'
$powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
$command = ('"{0}" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{1}" "%1"' -f $powerShell, $windowLauncherScript)

New-Item -Path $protocolRoot -Force | Out-Null
Set-Item -Path $protocolRoot -Value 'URL:立之雲端庫理財 AI Host'
New-ItemProperty -Path $protocolRoot -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
New-Item -Path "$protocolRoot\DefaultIcon" -Force | Out-Null
Set-Item -Path "$protocolRoot\DefaultIcon" -Value "$powerShell,0"
New-Item -Path "$protocolRoot\shell\open\command" -Force | Out-Null
Set-Item -Path "$protocolRoot\shell\open\command" -Value $command

$startupDirectory = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDirectory '立之雲端庫理財AI.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $powerShell
$shortcut.Arguments = ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}"' -f $hostScript)
$shortcut.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$shortcut.Description = '登入 Windows 後啟動立之雲端庫理財 AI Host'
$shortcut.Save()

Write-Host "Registered ${protocolName}:// URL handler for the current Windows user."
Write-Host "Installed startup shortcut: $shortcutPath"
