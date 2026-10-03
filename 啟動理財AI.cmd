@echo off
setlocal
chcp 65001 >nul
title 立之雲端庫 - 理財 AI 連線
cd /d "%~dp0"

echo 正在連接理財 AI，請稍候...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-finance-ai-host.ps1"
set "LIZHI_AI_EXIT=%ERRORLEVEL%"

if not "%LIZHI_AI_EXIT%"=="0" (
  echo.
  echo 理財 AI 啟動失敗。請保留這個視窗，依上方訊息檢查設定。
  pause
  exit /b %LIZHI_AI_EXIT%
)

echo.
echo 理財 AI 已連線，瀏覽器中的家中 AI 主機頁面已開啟。
timeout /t 3 /nobreak >nul
exit /b 0
