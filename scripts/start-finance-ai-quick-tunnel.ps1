param(
  [string]$CloudflaredPath = 'C:\Cloudflared\bin\cloudflared.exe'
)

$ErrorActionPreference = 'Stop'
$gatewayUrl = 'http://127.0.0.1:4181'
$allowedLoopback = @('127.0.0.1', '::1')

if (-not (Test-Path -LiteralPath $CloudflaredPath -PathType Leaf)) {
  throw "cloudflared not found: $CloudflaredPath"
}

$cloudflaredHome = Join-Path $env:USERPROFILE '.cloudflared'
$conflictingConfig = @('config.yml', 'config.yaml') |
  ForEach-Object { Join-Path $cloudflaredHome $_ } |
  Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
if ($conflictingConfig) {
  throw "Quick Tunnel cannot start while a Cloudflare config file is present: $($conflictingConfig -join ', ')"
}

$gatewayListeners = @(Get-NetTCPConnection -LocalPort 4181 -State Listen -ErrorAction SilentlyContinue)
if (-not $gatewayListeners.Count) {
  throw 'Finance AI Gateway is not listening on 127.0.0.1:4181.'
}
if ($gatewayListeners | Where-Object { $_.LocalAddress -ne '127.0.0.1' }) {
  throw 'Finance AI Gateway must bind only to 127.0.0.1:4181 before starting a Tunnel.'
}

$ollamaListeners = @(Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue)
if (-not $ollamaListeners.Count) {
  throw 'Ollama is not listening on loopback port 11434.'
}
if ($ollamaListeners | Where-Object { $allowedLoopback -notcontains $_.LocalAddress }) {
  throw 'Ollama must bind only to loopback before starting a Tunnel.'
}

$health = Invoke-RestMethod -Uri "$gatewayUrl/health" -TimeoutSec 5
if ($health.status -ne 'ok' -or $health.service -ne 'finance-ai-gateway') {
  throw 'Finance AI Gateway health check failed.'
}

Write-Host 'Starting a temporary Cloudflare Quick Tunnel for Finance AI Gateway.'
Write-Host 'Copy the generated https://*.trycloudflare.com base URL into Finance AI Gateway settings.'
Write-Host 'Quick Tunnel is for Phase 6A validation only; keep this window open.'
& $CloudflaredPath tunnel --url $gatewayUrl
if ($LASTEXITCODE -ne 0) {
  throw "cloudflared exited with code $LASTEXITCODE"
}
