$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$gatewayScript = Join-Path $PSScriptRoot 'start-finance-ai-gateway.ps1'
$hostUrl = 'https://lihuany635-create.github.io/lizhi-cloud-web/?open=finance&aiHost=1&autoEntry=0'
$allowedLoopback = @('127.0.0.1', '::1')

function Get-Listeners([int]$Port) {
  return @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

$ollamaListeners = Get-Listeners 11434
if (-not $ollamaListeners.Count) { throw 'Ollama is not listening on loopback port 11434.' }
if ($ollamaListeners | Where-Object { $allowedLoopback -notcontains $_.LocalAddress }) {
  throw 'Ollama must bind only to loopback before starting Finance AI Host.'
}

$gatewayListeners = Get-Listeners 4181
if (-not $gatewayListeners.Count) {
  $pwsh = (Get-Command pwsh -ErrorAction Stop).Source
  Start-Process -FilePath $pwsh -ArgumentList @('-NoProfile', '-File', $gatewayScript) -WorkingDirectory $repoRoot -WindowStyle Hidden
  $deadline = [DateTime]::UtcNow.AddSeconds(15)
  do {
    Start-Sleep -Milliseconds 300
    $gatewayListeners = Get-Listeners 4181
  } while (-not $gatewayListeners.Count -and [DateTime]::UtcNow -lt $deadline)
}
if (-not $gatewayListeners.Count) { throw 'Finance AI Gateway did not start on port 4181.' }
if ($gatewayListeners | Where-Object { $_.LocalAddress -ne '127.0.0.1' }) {
  throw 'Finance AI Gateway must bind only to 127.0.0.1:4181.'
}

$health = Invoke-RestMethod -Uri 'http://127.0.0.1:4181/health' -TimeoutSec 5
if ($health.status -ne 'ok' -or $health.service -ne 'finance-ai-gateway') {
  throw 'Finance AI Gateway health check failed.'
}

Write-Host 'Finance AI Gateway and Ollama are loopback-only and healthy.'
Write-Host 'Opening Browser AI Host. Keep the signed-in tab open while using mobile AI parsing.'
Start-Process $hostUrl

