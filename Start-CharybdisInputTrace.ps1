param(
    [ValidateSet('Start', 'Stop', 'Status')]
    [string]$Action = 'Start'
)

$ErrorActionPreference = 'Stop'
$SessionName = 'CharybdisInputTrace'
$SessionRecord = 'charybdis_usb_latest.txt'

if ((Split-Path -Leaf $PSScriptRoot) -ieq 'runtime') {
    $RuntimeDir = $PSScriptRoot
} elseif (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'Start-Charybdis.ps1')) {
    $RuntimeDir = Join-Path $PSScriptRoot 'runtime'
} else {
    $RuntimeDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'runtime'
}
New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null
$RecordPath = Join-Path $RuntimeDir $SessionRecord

function Invoke-Logman([string[]]$Arguments) {
    $output = & logman.exe @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "logman $($Arguments -join ' ') failed: $($output -join [Environment]::NewLine)"
    }
    return $output
}

function Test-TraceRunning {
    & logman.exe query $SessionName -ets *> $null
    return $LASTEXITCODE -eq 0
}

switch ($Action) {
    'Start' {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = [Security.Principal.WindowsPrincipal]::new($identity)
        if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
            throw 'Run this script from an elevated PowerShell window (Run as administrator).'
        }

        if (Test-TraceRunning) {
            $current = if (Test-Path -LiteralPath $RecordPath) { Get-Content -Raw $RecordPath } else { '(trace path record unavailable)' }
            Write-Output "Trace is already running. $current"
            break
        }

        # Remove a stale stopped collector definition so Start is repeatable.
        & logman.exe query $SessionName *> $null
        if ($LASTEXITCODE -eq 0) { Invoke-Logman @('delete', $SessionName) | Out-Null }

        $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $etlPath = Join-Path $RuntimeDir "charybdis_usb_$stamp.etl"
        $providerFile = Join-Path $RuntimeDir "charybdis_usb_providers_$stamp.txt"
        @(
            '{AC52AD17-CC01-4F85-8DF5-4DCE4333C99B} 0xffffffffffffffff 5' # USBHUB3
            '{30E1D284-5D88-459C-83FD-6345B39B19EC} 0xffffffffffffffff 5' # USBXHCI
            '{36DA592D-E43A-4E28-AF6F-4BC57C5A11E8} 0xffffffffffffffff 5' # UCX
            '{6465DA78-E7A0-4F39-B084-8F53C7C30DC6} 0xffffffffffffffff 5' # HIDCLASS
        ) | Set-Content -LiteralPath $providerFile -Encoding ASCII

        try {
            Invoke-Logman @('create', 'trace', $SessionName, '-o', $etlPath, '-f', 'bincirc', '-max', '128', '-pf', $providerFile) | Out-Null
            Invoke-Logman @('start', $SessionName) | Out-Null
            $query = (Invoke-Logman @('query', $SessionName)) -join [Environment]::NewLine
            $outputMatch = [regex]::Match($query, '(?m)^Output Location:\s*(.+?)\s*$')
            $actualEtlPath = if ($outputMatch.Success) { $outputMatch.Groups[1].Value } else { $etlPath }
            Set-Content -LiteralPath $RecordPath -Value $actualEtlPath -Encoding ASCII
            Write-Output "USB/HID trace started. Circular cap: 128 MiB. Trace: $actualEtlPath"
            Write-Output "Stop after the next freeze with: & '$PSCommandPath' -Action Stop"
        } finally {
            Remove-Item -LiteralPath $providerFile -Force -ErrorAction SilentlyContinue
        }
    }
    'Stop' {
        if (-not (Test-TraceRunning)) {
            Write-Output 'Trace is not running.'
            if (Test-Path -LiteralPath $RecordPath) { Write-Output "Last trace: $(Get-Content -Raw $RecordPath)" }
            break
        }
        Invoke-Logman @('stop', $SessionName) | Out-Null
        $tracePath = if (Test-Path -LiteralPath $RecordPath) { (Get-Content -Raw $RecordPath).Trim() } else { '(trace path record unavailable)' }
        Write-Output "Trace stopped and saved: $tracePath"
    }
    'Status' {
        if (Test-TraceRunning) {
            Write-Output 'Trace is running.'
            if (Test-Path -LiteralPath $RecordPath) { Write-Output "Trace: $(Get-Content -Raw $RecordPath)" }
        } else {
            Write-Output 'Trace is not running.'
            if (Test-Path -LiteralPath $RecordPath) { Write-Output "Last trace: $(Get-Content -Raw $RecordPath)" }
        }
    }
}
