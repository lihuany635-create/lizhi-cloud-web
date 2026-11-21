# Stop the chat room: both agent windows and the chat server.
# Only touches windows started from THIS folder's .venv (never other Python apps).
param([switch]$Quiet)

$venvPy = [regex]::Escape((Join-Path $PSScriptRoot '.venv\Scripts\python.exe'))
$targets = @(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -in 'conhost.exe', 'python.exe' -and $_.CommandLine -match $venvPy -and
  $_.CommandLine -match 'run\.py|wrapper\.py (claude|codex)|supabase_bridge\.py'
})
foreach ($t in $targets) { taskkill /T /F /PID $t.ProcessId 2>$null | Out-Null }

if (-not $Quiet) { Write-Host "Chat room stopped ($($targets.Count) windows)." }
