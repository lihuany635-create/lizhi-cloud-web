$ErrorActionPreference = 'Stop'
$host.UI.RawUI.WindowTitle = '立之雲端庫 - 理財 AI 連線'
$hostScript = Join-Path $PSScriptRoot 'start-finance-ai-host.ps1'

Add-Type -AssemblyName PresentationFramework

try {
  & $hostScript
  $health = Invoke-RestMethod -Uri 'http://127.0.0.1:4181/health' -TimeoutSec 5
  if ($health.status -ne 'ok' -or $health.service -ne 'finance-ai-gateway') {
    throw 'Finance AI Gateway 健康檢查未通過。'
  }
  [System.Windows.MessageBox]::Show(
    "理財 AI 已連線。`n`nOllama：已就緒`nGateway：127.0.0.1:4181`n家中 AI Host：已開啟",
    '立之雲端庫',
    [System.Windows.MessageBoxButton]::OK,
    [System.Windows.MessageBoxImage]::Information
  ) | Out-Null
  exit 0
} catch {
  $message = "理財 AI 啟動失敗。`n`n$($_.Exception.Message)"
  [System.Windows.MessageBox]::Show(
    $message,
    '立之雲端庫',
    [System.Windows.MessageBoxButton]::OK,
    [System.Windows.MessageBoxImage]::Error
  ) | Out-Null
  exit 1
}
