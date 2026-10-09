$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$gatewayScript = Join-Path $PSScriptRoot 'start-finance-ai-gateway.ps1'
$launchNonce = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$hostUrl = "https://lihuany635-create.github.io/lizhi-cloud-web/?open=finance&aiHost=1&autoEntry=0&launch=$launchNonce"
$allowedLoopback = @('127.0.0.1', '::1')

function Get-HostBrowserPath {
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe')
  )
  return $candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
}

function Get-Listeners([int]$Port) {
  return @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-Listeners([int]$Port, [int]$TimeoutSeconds) {
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  do {
    $listeners = @(Get-Listeners $Port)
    if ($listeners.Count) { return @($listeners) }
    Start-Sleep -Milliseconds 300
  } while ([DateTime]::UtcNow -lt $deadline)
  return @()
}

function Assert-LoopbackOnly($Listeners, [int]$Port, [string[]]$AllowedAddresses) {
  if ($Listeners | Where-Object { $AllowedAddresses -notcontains $_.LocalAddress }) {
    throw "Port $Port must bind only to loopback."
  }
}

$ollamaListeners = @(Get-Listeners 11434)
if (-not $ollamaListeners.Count) {
  $ollama = Get-Command ollama -ErrorAction Stop
  $previousOllamaHost = $env:OLLAMA_HOST
  try {
    $env:OLLAMA_HOST = '127.0.0.1:11434'
    Start-Process -FilePath $ollama.Source -ArgumentList @('serve') -WorkingDirectory $repoRoot -WindowStyle Hidden
  } finally {
    if ($null -eq $previousOllamaHost) { Remove-Item Env:OLLAMA_HOST -ErrorAction SilentlyContinue }
    else { $env:OLLAMA_HOST = $previousOllamaHost }
  }
  $ollamaListeners = @(Wait-Listeners 11434 30)
}
if (-not $ollamaListeners.Count) { throw 'Ollama did not start on port 11434.' }
Assert-LoopbackOnly $ollamaListeners 11434 $allowedLoopback

$gatewayListeners = @(Get-Listeners 4181)
if (-not $gatewayListeners.Count) {
  $powerShellExecutable = (Get-Process -Id $PID).Path
  $quotedGatewayScript = '"{0}"' -f $gatewayScript
  Start-Process -FilePath $powerShellExecutable -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $quotedGatewayScript) -WorkingDirectory $repoRoot -WindowStyle Hidden
  $gatewayListeners = @(Wait-Listeners 4181 30)
}
if (-not $gatewayListeners.Count) { throw 'Finance AI Gateway did not start on port 4181.' }
Assert-LoopbackOnly $gatewayListeners 4181 @('127.0.0.1')

$health = Invoke-RestMethod -Uri 'http://127.0.0.1:4181/health' -TimeoutSec 5
if ($health.status -ne 'ok' -or $health.service -ne 'finance-ai-gateway') {
  throw 'Finance AI Gateway health check failed.'
}

Write-Host 'Ollama ready'
Write-Host 'Finance AI Gateway ready'
$hostBrowser = Get-HostBrowserPath
if (-not $hostBrowser) { throw 'Microsoft Edge or Google Chrome is required for the Finance AI Host.' }
$hostArguments = @(
  "--app=$hostUrl",
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling',
  '--no-first-run'
)
Start-Process -FilePath $hostBrowser -ArgumentList $hostArguments -WorkingDirectory $repoRoot
Write-Host 'Dedicated Browser AI Host opened'
