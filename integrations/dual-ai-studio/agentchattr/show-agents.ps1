# Show (or hide again) the background agent windows.
#   show-agents.ps1        -> bring Claude / Codex windows to the front
#   show-agents.ps1 -Hide  -> send them back to the background
param([switch]$Hide)

$py = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$helper = Join-Path $PSScriptRoot 'tools\console_window.py'
$action = if ($Hide) { 'hide' } else { 'show' }

$found = 0
foreach ($agent in 'claude', 'codex') {
  # The wrapper process that owns each agent's console window
  $w = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'python.exe' -and $_.CommandLine -match "wrapper\.py $agent" -and $_.CommandLine -notmatch '\.venv'
  } | Select-Object -First 1
  if ($w) {
    & $py -I $helper $w.ProcessId $action "$agent agent - chat room"
    $found++
  }
}
if ($found -eq 0) { Write-Host "No agents are running. Start with start-chat.bat." }
else { Write-Host "$found agent window(s): $action." }
