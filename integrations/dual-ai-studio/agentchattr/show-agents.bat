@echo off
REM Double-click to bring the background agent windows to the front.
REM To hide them again run:  show-agents.bat -Hide
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0show-agents.ps1" %*
timeout /t 3 >nul
