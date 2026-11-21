@echo off
REM Double-click to start the cross-AI chat room in the background (auto-run mode).
REM Options:  start-chat.bat -Safe      (agents ask before each action)
REM           start-chat.bat -Visible   (show the agent windows)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-chat.ps1" %*
if errorlevel 1 (pause) else (timeout /t 5 >nul)
