param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('Prepare', 'Stop', 'Cancel', 'StartLive', 'StopLive', 'StatusLive')]
  [string]$Action
)

$ErrorActionPreference = 'Stop'
$Runtime = Join-Path $PSScriptRoot 'runtime'
New-Item -ItemType Directory -Path $Runtime -Force | Out-Null
$Profile = Join-Path $PSScriptRoot 'CharybdisUsbBoot.wprp'
$Wpr = Join-Path $env:WINDIR 'System32\wpr.exe'
$LiveRecord = Join-Path $Runtime 'charybdis_live_latest.txt'

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from an elevated PowerShell window (Run as administrator).'
  }
}

if (-not (Test-Path -LiteralPath $Wpr)) { throw "wpr.exe not found: $Wpr" }

switch ($Action) {
  'Prepare' {
    Assert-Admin
    if (-not (Test-Path -LiteralPath $Profile)) { throw "Profile not found: $Profile" }
    $profileSpec = $Profile + '!CharybdisUsb.Verbose'
    & $Wpr -boottrace -addboot $profileSpec
    if ($LASTEXITCODE -ne 0) { throw "wpr -addboot failed with exit code $LASTEXITCODE" }
    Write-Output 'Prepared bounded circular USB/HID, Kernel-PnP, and kernel scheduling boot trace. No restart was initiated.'
    Write-Output "After next sign-in, stop and save it with: & '$PSCommandPath' -Action Stop"
    Write-Output "To cancel before reboot: & '$PSCommandPath' -Action Cancel"
  }
  'Stop' {
    Assert-Admin
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $trace = Join-Path $Runtime "charybdis_usb_boot_$stamp.etl"
    & $Wpr -boottrace -stopboot $trace 'Charybdis keyboard and trackball input freeze'
    if ($LASTEXITCODE -ne 0) { throw "wpr -stopboot failed with exit code $LASTEXITCODE" }
    Write-Output "Boot trace saved: $trace"
  }
  'Cancel' {
    Assert-Admin
    & $Wpr -boottrace -cancelboot
    if ($LASTEXITCODE -ne 0) { throw "wpr -cancelboot failed with exit code $LASTEXITCODE" }
    Write-Output 'Boot trace configuration canceled.'
  }
  'StartLive' {
    Assert-Admin
    if (-not (Test-Path -LiteralPath $Profile)) { throw "Profile not found: $Profile" }
    $profileSpec = $Profile + '!CharybdisUsb.Verbose'
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $trace = Join-Path $Runtime "charybdis_input_live_$stamp.etl"
    & $Wpr -start $profileSpec
    if ($LASTEXITCODE -ne 0) { throw "wpr -start failed with exit code $LASTEXITCODE" }
    Set-Content -LiteralPath $LiveRecord -Value $trace -Encoding ASCII
    Write-Output 'Live circular capture started: USB/HID, Kernel-PnP, scheduling, and interrupt events.'
    Write-Output 'Memory bound: 192 MiB. Stop immediately after a marked freeze.'
    Write-Output "Stop command: & '$PSCommandPath' -Action StopLive"
    Write-Output "Trace path: $trace"
  }
  'StopLive' {
    Assert-Admin
    if (-not (Test-Path -LiteralPath $LiveRecord)) { throw "No live trace path record found: $LiveRecord" }
    $trace = (Get-Content -LiteralPath $LiveRecord -Raw).Trim()
    if (-not $trace) { throw 'Live trace path record is empty.' }
    & $Wpr -stop $trace 'Charybdis keyboard and trackball input freeze'
    if ($LASTEXITCODE -ne 0) { throw "wpr -stop failed with exit code $LASTEXITCODE" }
    Write-Output "Live trace saved: $trace"
  }
  'StatusLive' {
    & $Wpr -status
    if ($LASTEXITCODE -ne 0) { throw "wpr -status failed with exit code $LASTEXITCODE" }
    if (Test-Path -LiteralPath $LiveRecord) {
      Write-Output "Recorded trace path: $((Get-Content -LiteralPath $LiveRecord -Raw).Trim())"
    }
  }
}
