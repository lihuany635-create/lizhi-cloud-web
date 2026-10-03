@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

start "立之雲端庫 - 理財 AI 連線" "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-finance-ai-host.ps1"
exit /b 0
