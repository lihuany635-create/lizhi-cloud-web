# 雙AI工作室 控制面板（單一入口：啟動 / 打開聊天室 / 查看AI / 關閉）
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$root = $PSScriptRoot
$url  = 'http://127.0.0.1:8300'

function Test-Running {
  try { $c = New-Object Net.Sockets.TcpClient('127.0.0.1', 8300); $c.Close(); return $true } catch { return $false }
}
function Invoke-Script([string]$name, [string]$extra = '') {
  $file = Join-Path $root $name
  Start-Process powershell.exe -WindowStyle Hidden -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$file`" $extra"
}

$font  = New-Object System.Drawing.Font('Microsoft JhengHei UI', 10)
$form = New-Object System.Windows.Forms.Form
$form.Text = '雙AI工作室'
$form.Size = New-Object System.Drawing.Size(340, 330)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false
$form.Font = $font

$title = New-Object System.Windows.Forms.Label
$title.Text = '雙AI工作室  Claude + Codex'
$title.Font = New-Object System.Drawing.Font('Microsoft JhengHei UI', 12, [System.Drawing.FontStyle]::Bold)
$title.Location = New-Object System.Drawing.Point(20, 15)
$title.AutoSize = $true
$form.Controls.Add($title)

$status = New-Object System.Windows.Forms.Label
$status.Location = New-Object System.Drawing.Point(20, 48)
$status.Size = New-Object System.Drawing.Size(290, 22)
$form.Controls.Add($status)

$safe = New-Object System.Windows.Forms.CheckBox
$safe.Text = '安全模式（AI 每個動作都先問我）'
$safe.Location = New-Object System.Drawing.Point(20, 75)
$safe.AutoSize = $true
$form.Controls.Add($safe)

function New-Btn([string]$text, [int]$y) {
  $b = New-Object System.Windows.Forms.Button
  $b.Text = $text
  $b.Location = New-Object System.Drawing.Point(20, $y)
  $b.Size = New-Object System.Drawing.Size(285, 36)
  $form.Controls.Add($b)
  return $b
}
$btnStart = New-Btn '啟動（在背景執行）' 108
$btnOpen  = New-Btn '打開聊天室'         150
$btnShow  = New-Btn '查看 AI 視窗'       192
$btnStop  = New-Btn '關閉全部'           234

$script:busy = ''
function Update-Status {
  $running = Test-Running
  if ($script:busy) {
    $status.Text = $script:busy
    $status.ForeColor = [System.Drawing.Color]::DarkOrange
  } elseif ($running) {
    $status.Text = '● 運行中'
    $status.ForeColor = [System.Drawing.Color]::ForestGreen
  } else {
    $status.Text = '○ 已停止'
    $status.ForeColor = [System.Drawing.Color]::Gray
  }
  $btnStart.Enabled = (-not $running) -and (-not $script:busy)
  $btnOpen.Enabled  = $running
  $btnShow.Enabled  = $running
  $btnStop.Enabled  = $running -or [bool]$script:busy
  $safe.Enabled     = -not $running
}

$btnStart.Add_Click({
  $script:busy = '啟動中，約 30 秒…'
  Update-Status
  if ($safe.Checked) { Invoke-Script 'start-chat.ps1' '-Safe' } else { Invoke-Script 'start-chat.ps1' }
  $script:startedAt = Get-Date
})
$btnOpen.Add_Click({ Start-Process $url })
$btnShow.Add_Click({ Invoke-Script 'show-agents.ps1' })
$btnStop.Add_Click({
  $script:busy = '關閉中…'
  Update-Status
  Invoke-Script 'stop-chat.ps1'
  $script:stoppedAt = Get-Date
})

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 2000
$timer.Add_Tick({
  if ($script:busy -like '啟動中*' -and ((Test-Running) -and ((Get-Date) - $script:startedAt).TotalSeconds -gt 25)) { $script:busy = '' }
  if ($script:busy -like '啟動中*' -and ((Get-Date) - $script:startedAt).TotalSeconds -gt 90) { $script:busy = '' }
  if ($script:busy -eq '關閉中…' -and ((-not (Test-Running)) -or ((Get-Date) - $script:stoppedAt).TotalSeconds -gt 20)) { $script:busy = '' }
  Update-Status
})
$timer.Start()

Update-Status
[void]$form.ShowDialog()
