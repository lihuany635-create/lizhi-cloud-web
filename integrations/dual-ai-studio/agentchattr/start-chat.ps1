# One-click start for the cross-AI chat room (agentchattr + Claude + Codex).
#
#   Default : auto-run mode (Claude auto mode, Codex never-ask). Agents work in test-repo only.
#   -Safe   : every agent action asks for approval in its window.
#   -Visible: show the agent windows (default: run hidden in the background).
#             Hidden windows can be brought up any time with show-agents.bat.
#
# Global settings are NOT changed. Chat history is kept between runs.
param([switch]$Safe, [switch]$Visible)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 1. Stop anything still running from last time
& "$PSScriptRoot\stop-chat.ps1" -Quiet
Start-Sleep 2

# 2. Reset agent identities so names stay "claude" / "codex" (history is kept)
$old = Join-Path $PSScriptRoot 'data\old'
New-Item -ItemType Directory -Force $old | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($f in 'registry.json', 'renames.json', 'mcp_cursors.json') {
  $p = Join-Path $PSScriptRoot "data\$f"
  if (Test-Path $p) { Move-Item $p (Join-Path $old "$f.$stamp") }
}
Get-ChildItem (Join-Path $PSScriptRoot 'data') -Filter *_queue.jsonl -ErrorAction SilentlyContinue | Remove-Item

# 3. Ignore env vars that would point Claude Code at a local model (this launch only)
Get-ChildItem env: | Where-Object { $_.Name -match '^(CLAUDE|ANTHROPIC)' } |
  ForEach-Object { Remove-Item "env:$($_.Name)" -ErrorAction SilentlyContinue }

$win = if ($Visible) { 'Normal' } else { 'Hidden' }

# Make claude.exe (official installer) and the native codex.exe (npm package) findable.
# Calling codex.exe directly avoids codex.cmd, whose cmd.exe layer breaks quoted arguments.
$codexBin = Join-Path $env:APPDATA 'npm\node_modules\@openai\codex\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin'
$env:PATH = "$env:USERPROFILE\.local\bin;$codexBin;$env:PATH"

# 4. Start the chat server in its own window and wait for it
$py = (Resolve-Path .\.venv\Scripts\python.exe).Path
Start-Process conhost.exe -WindowStyle $win -ArgumentList "`"$py`" run.py" -WorkingDirectory $PSScriptRoot
$up = $false
for ($i = 0; $i -lt 30 -and -not $up; $i++) {
  try { $c = New-Object Net.Sockets.TcpClient('127.0.0.1', 8300); $c.Close(); $up = $true } catch { Start-Sleep 1 }
}
if (-not $up) { Write-Host "ERROR: chat server did not start. Check its window."; exit 1 }

# 5. Start the two agents (classic console windows; Windows Terminal breaks key input)
if ($Safe) {
  $claudeArgs = '--permission-mode default --allowedTools mcp__agentchattr'
  $codexArgs  = '-c approval_policy=on-request -c sandbox_mode=workspace-write'
  $mode = 'SAFE (asks before each action)'
} else {
  $claudeArgs = '--permission-mode auto'
  $codexArgs  = '-c approval_policy=never -c sandbox_mode=danger-full-access'
  $mode = 'AUTO (agents act on their own in test-repo)'
}
Start-Process conhost.exe -WindowStyle $win -ArgumentList "`"$py`" wrapper.py claude -- $claudeArgs" -WorkingDirectory $PSScriptRoot
Start-Sleep 5
Start-Process conhost.exe -WindowStyle $win -ArgumentList "`"$py`" wrapper.py codex -- $codexArgs" -WorkingDirectory $PSScriptRoot
Start-Sleep 10

# 6. Open the chat room
Start-Process 'http://127.0.0.1:8300'
Write-Host ""
Write-Host "Chat room is running.  Mode: $mode"
Write-Host "  Open : http://127.0.0.1:8300"
Write-Host "  Talk : @claude / @codex in the message box"
Write-Host "  Stop : double-click stop-chat.bat"
Write-Host "  Stuck? double-click show-agents.bat to see the agent windows"
