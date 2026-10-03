@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-finance-ai-host-window.ps1"
exit /b %ERRORLEVEL%
