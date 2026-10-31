$ErrorActionPreference = 'Stop'

if ((Split-Path -Leaf $PSScriptRoot) -ieq 'runtime') {
    $RuntimeDir = $PSScriptRoot
} elseif (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'Start-Charybdis.ps1')) {
    $RuntimeDir = Join-Path $PSScriptRoot 'runtime'
} else {
    $RuntimeDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'runtime'
}
New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null
$MarkerLog = Join-Path $RuntimeDir 'freeze_markers.jsonl'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Charybdis freeze marker'
$form.ClientSize = New-Object System.Drawing.Size(420, 170)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false
$form.MinimizeBox = $true
$form.ShowInTaskbar = $true
$form.TopMost = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$form.Location = New-Object System.Drawing.Point(($area.Right - $form.Width - 16), ($area.Top + 32))

$instruction = New-Object System.Windows.Forms.Label
$instruction.Text = 'Click once when the keyboard or trackball freezes.'
$instruction.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
$instruction.Location = New-Object System.Drawing.Point(12, 10)
$instruction.Size = New-Object System.Drawing.Size(396, 28)

$button = New-Object System.Windows.Forms.Button
$button.Text = 'MARK FREEZE'
$button.Font = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
$button.BackColor = [System.Drawing.Color]::Firebrick
$button.ForeColor = [System.Drawing.Color]::White
$button.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$button.Location = New-Object System.Drawing.Point(12, 44)
$button.Size = New-Object System.Drawing.Size(396, 76)
$button.Cursor = [System.Windows.Forms.Cursors]::Hand

$status = New-Object System.Windows.Forms.Label
$status.Text = 'Each click records the time in runtime\freeze_markers.jsonl.'
$status.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
$status.Location = New-Object System.Drawing.Point(12, 128)
$status.Size = New-Object System.Drawing.Size(396, 28)

$clickHandler = {
    $now = [DateTimeOffset]::Now
    $record = [ordered]@{
        type = 'manual_freeze_marker'
        ts_local = $now.ToString('o')
        ts_utc = $now.UtcDateTime.ToString('o')
        tick_ms = [Environment]::TickCount64
    }
    try {
        $json = ($record | ConvertTo-Json -Compress) + [Environment]::NewLine
        [System.IO.File]::AppendAllText($MarkerLog, $json, [System.Text.UTF8Encoding]::new($false))
        $status.Text = "Marked $($now.ToString('HH:mm:ss.fff')). Click again for another freeze."
        $status.ForeColor = [System.Drawing.Color]::DarkGreen
    } catch {
        $status.Text = "Could not write marker: $($_.Exception.Message)"
        $status.ForeColor = [System.Drawing.Color]::DarkRed
    }
}.GetNewClosure()
$button.Add_Click($clickHandler)

$form.Controls.AddRange(@($instruction, $button, $status))
[System.Windows.Forms.Application]::Run($form)
