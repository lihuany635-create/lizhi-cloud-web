@echo off
REM Double-click to stop the cross-AI chat room (server + both agents).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-chat.ps1"
timeout /t 3 >nul
