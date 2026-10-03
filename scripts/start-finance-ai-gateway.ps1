$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot '.env'
if (Test-Path -LiteralPath $envFile) {
  foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $name, $value = $line -split '=', 2
    $name = $name.Trim()
    if ($name -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
      [Environment]::SetEnvironmentVariable($name, $value.Trim(), 'Process')
    }
  }
}
$node = Get-Command node -ErrorAction Stop
$required = @('OLLAMA_MODEL','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','LIZHI_ALLOWED_USER')
$missing = $required | Where-Object { [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_)) }
if ($missing.Count) { throw "Missing Finance Gateway environment settings: $($missing -join ', ')" }
if (-not $env:FINANCE_GATEWAY_ALLOWED_ORIGINS) { $env:FINANCE_GATEWAY_ALLOWED_ORIGINS = 'http://127.0.0.1:4180,http://localhost:4180' }
$env:FINANCE_GATEWAY_HOST = '127.0.0.1'
$env:FINANCE_GATEWAY_PORT = '4181'
$listener = Get-NetTCPConnection -LocalPort 4181 -State Listen -ErrorAction SilentlyContinue
if ($listener) { throw 'Port 4181 is already in use. Stop the existing process before starting Finance AI Gateway.' }
$ollama = [System.Net.Sockets.TcpClient]::new()
try {
  $pending = $ollama.BeginConnect('127.0.0.1', 11434, $null, $null)
  if (-not $pending.AsyncWaitHandle.WaitOne(750)) { Write-Warning 'Ollama is not reachable on 127.0.0.1:11434. Gateway will start, but parse requests will safely fail.' }
  elseif ($ollama.Connected) { $ollama.EndConnect($pending) }
} catch { Write-Warning 'Ollama is not reachable on 127.0.0.1:11434. Gateway will start, but parse requests will safely fail.' }
finally { $ollama.Dispose() }
& $node.Source --use-system-ca (Join-Path $repoRoot 'finance\gateway\finance-ai-gateway.mjs')
