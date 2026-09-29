[CmdletBinding()]
param(
    [ValidateSet("Start", "Stop", "Restart", "Status", "InstallStartup", "UninstallStartup")]
    [string]$Action = "Start",
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$Runtime = Join-Path $Root "runtime"
$Deps = Join-Path $Runtime "dependencies"
$Coach = Join-Path $Root "coach"
$Helper = Join-Path $Root "ahk\charybdis_helpers.ahk"
$Server = Join-Path $Root "python\coach_http_server.py"
$State = Join-Path $Runtime "charybdis_state.json"
$PortFile = Join-Path $Runtime "coach_server_port.txt"
$AhkPidFile = Join-Path $Runtime "logger_beacon.pid.json"
$ServerPidFile = Join-Path $Runtime "coach_server.pid.json"
$LogDir = Join-Path $Runtime "logs"
$mutex = [Threading.Mutex]::new($false, "Local\PortableCharybdis")
$hasMutex = $false

function Write-Info([string]$Message) { Write-Host "[portable-charybdis] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[portable-charybdis] $Message" -ForegroundColor Green }

function Get-Json([string]$Path) {
    if (Test-Path -LiteralPath $Path) {
        try { return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json } catch { }
    }
    return $null
}

function Save-Json([string]$Path, $Value) {
    $temp = "$Path.$([Guid]::NewGuid().ToString('N')).tmp"
    $Value | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $temp -Encoding UTF8
    Move-Item -LiteralPath $temp -Destination $Path -Force
}

function Get-PortablePython {
    $arch = $env:PROCESSOR_ARCHITECTURE
    if ($env:PROCESSOR_ARCHITEW6432) { $arch = $env:PROCESSOR_ARCHITEW6432 }
    if ($arch -match "ARM64") {
        $pythonArch = "arm64"
        $pythonHash = "cd992cbfb33be433ff20f150691595efb2862e56f4f1bec684c6077d4775af8e"
    } elseif ($arch -match "AMD64|x64") {
        $pythonArch = "amd64"
        $pythonHash = "d1f04d990aee1253d8569e8e5104e30fa9f5fa830899f14843448872d936a2cf"
    } else {
        throw "This portable package supports 64-bit Windows (x64 or ARM64); detected '$arch'."
    }

    $pythonDir = Join-Path $Deps "python-3.13.15-$pythonArch"
    $pythonExe = Join-Path $pythonDir "python.exe"
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        $url = "https://www.python.org/ftp/python/3.13.15/python-3.13.15-embed-$pythonArch.zip"
        Install-VerifiedZip -Url $url -Sha256 $pythonHash -Destination $pythonDir -RequiredFile "python.exe"
    }
    return $pythonExe
}

function Get-PortableAhk {
    $ahkDir = Join-Path $Deps "autohotkey-2.0.28"
    $ahkExe = Join-Path $ahkDir "AutoHotkey64.exe"
    if (-not (Test-Path -LiteralPath $ahkExe)) {
        Install-VerifiedZip `
            -Url "https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.28/AutoHotkey_2.0.28.zip" `
            -Sha256 "b63be7548792b4ad0dfe424d91cc69376694ed2f758245b7a75a0c77d693b478" `
            -Destination $ahkDir -RequiredFile "AutoHotkey64.exe"
    }
    return $ahkExe
}

function Install-VerifiedZip {
    param([string]$Url, [string]$Sha256, [string]$Destination, [string]$RequiredFile)
    New-Item -ItemType Directory -Path $Deps -Force | Out-Null
    $zipPath = Join-Path $Deps ("download-" + [Guid]::NewGuid().ToString("N") + ".zip")
    $partial = "$Destination.installing"
    try {
        Write-Info "Downloading portable runtime from its official source..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        (New-Object Net.WebClient).DownloadFile($Url, $zipPath)
        $actual = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $Sha256) { throw "Runtime checksum mismatch for $Url. Download discarded." }
        if (Test-Path -LiteralPath $partial) { Remove-Item -LiteralPath $partial -Recurse -Force }
        New-Item -ItemType Directory -Path $partial -Force | Out-Null
        Expand-Archive -LiteralPath $zipPath -DestinationPath $partial -Force
        if (-not (Test-Path -LiteralPath (Join-Path $partial $RequiredFile))) {
            throw "Official runtime archive did not contain $RequiredFile."
        }
        if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Recurse -Force }
        Move-Item -LiteralPath $partial -Destination $Destination
        Write-Ok "Portable runtime ready."
    } finally {
        Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $partial -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Test-PortAvailable([int]$Port) {
    $tcp = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
    try { $tcp.Start(); return $true }
    catch [Net.Sockets.SocketException] { return $false }
    finally { $tcp.Stop() }
}

function Find-CoachPort([int]$Preferred) {
    for ($port = $Preferred; $port -le [Math]::Min(65535, $Preferred + 99); $port++) {
        if (Test-PortAvailable $port) { return $port }
    }
    throw "No free coach port found between $Preferred and $([Math]::Min(65535, $Preferred + 99))."
}

function Get-TrackedProcess([string]$RecordPath, [string]$CommandToken) {
    $record = Get-Json $RecordPath
    if (-not $record) { return $null }
    try { $process = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$record.pid)" -ErrorAction Stop }
    catch { return $null }
    if (-not $process -or -not $process.CommandLine -or
        -not $process.CommandLine.Contains($CommandToken) -or
        -not $process.CommandLine.Contains($Root)) { return $null }
    return $process
}

function Stop-TrackedProcess([string]$RecordPath, [string]$CommandToken) {
    $process = Get-TrackedProcess $RecordPath $CommandToken
    if ($process) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Info "Stopped $CommandToken (PID $($process.ProcessId))."
    }
    Remove-Item -LiteralPath $RecordPath -Force -ErrorAction SilentlyContinue
}

function Test-CoachServer([int]$Port) {
    try {
        $result = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/charybdis-coach/" -UseBasicParsing -TimeoutSec 2
        return $result.StatusCode -eq 200
    } catch { return $false }
}

function Start-PortableStack {
    if (-not (Test-Path -LiteralPath $Helper) -or -not (Test-Path -LiteralPath (Join-Path $Coach "index.html")) -or -not (Test-Path -LiteralPath $Server)) {
        throw "Portable Charybdis files are incomplete. Pull the repository again."
    }
    New-Item -ItemType Directory -Path $Runtime, $LogDir -Force | Out-Null
    $python = Get-PortablePython
    $ahk = Get-PortableAhk
    $configPath = Join-Path $Root "keyboard-data\config\charybdis_helper.json"
    $config = Get-Json $configPath
    $preferredPort = 8765
    if ($config -and $config.coach_server_port -ge 1 -and $config.coach_server_port -le 65535) {
        $preferredPort = [int]$config.coach_server_port
    }
    $activePort = $preferredPort
    if (Test-Path -LiteralPath $PortFile) {
        try { $activePort = [int](Get-Content -Raw $PortFile) } catch { $activePort = $preferredPort }
    }

    $serverProcess = Get-TrackedProcess $ServerPidFile "coach_http_server.py"
    if ($serverProcess -and (Test-CoachServer $activePort)) {
        Write-Info "Coach server already running at http://127.0.0.1:$activePort/charybdis-coach/"
    } else {
        Remove-Item -LiteralPath $ServerPidFile -Force -ErrorAction SilentlyContinue
        $activePort = Find-CoachPort $preferredPort
        $stdout = Join-Path $LogDir "coach-server.out.log"
        $stderr = Join-Path $LogDir "coach-server.err.log"
        $serverArgs = @(
            ('"' + $Server + '"'), [string]$activePort, "--bind", "127.0.0.1",
            "--coach-dir", ('"' + $Coach + '"'), "--state-file", ('"' + $State + '"')
        )
        $serverProcess = Start-Process -FilePath $python -ArgumentList $serverArgs `
            -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $stdout `
            -RedirectStandardError $stderr -PassThru
        Save-Json $ServerPidFile @{ pid = $serverProcess.Id; command = "coach_http_server.py"; root = $Root }
        Set-Content -LiteralPath $PortFile -Value ([string]$activePort) -Encoding ASCII
        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 250
            if (Test-CoachServer $activePort) { $ready = $true; break }
            if ($serverProcess.HasExited) { break }
        }
        if (-not $ready) { throw "Coach server did not become ready. See $stderr" }
        Write-Ok "Coach server ready on port $activePort."
    }

    $helperProcess = Get-TrackedProcess $AhkPidFile "charybdis_helpers.ahk"
    if (-not $helperProcess) {
        Remove-Item -LiteralPath $AhkPidFile -Force -ErrorAction SilentlyContinue
        $startedAhk = Start-Process -FilePath $ahk -ArgumentList @(('"' + $Helper + '"')) `
            -WorkingDirectory $Root -PassThru
        Start-Sleep -Milliseconds 800
        $helperProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($startedAhk.Id)" -ErrorAction SilentlyContinue
        if (-not $helperProcess -or -not $helperProcess.CommandLine.Contains($Helper)) {
            throw "The keyboard logger/beacon helper did not stay running. Check AutoHotkey and Windows security settings."
        }
        Save-Json $AhkPidFile @{ pid = [int]$helperProcess.ProcessId; command = "charybdis_helpers.ahk"; root = $Root }
        Write-Ok "Keyboard logger and beacon helper running."
    } else {
        Write-Info "Keyboard logger and beacon helper already running."
    }

    $url = "http://127.0.0.1:$activePort/charybdis-coach/"
    if (-not $NoBrowser -and (!$config -or $config.coach_open_browser_on_start -ne $false)) {
        Start-Process $url | Out-Null
    }
    Write-Host "Coach: $url" -ForegroundColor Green
    Write-Host "Log data: $Runtime" -ForegroundColor DarkGray
}

function Stop-PortableStack {
    Stop-TrackedProcess $AhkPidFile "charybdis_helpers.ahk"
    Stop-TrackedProcess $ServerPidFile "coach_http_server.py"
    Write-Ok "Portable Charybdis stopped."
}

function Show-Status {
    $port = 8765
    if (Test-Path -LiteralPath $PortFile) { try { $port = [int](Get-Content -Raw $PortFile) } catch { } }
    $coach = Test-CoachServer $port
    $helper = [bool](Get-TrackedProcess $AhkPidFile "charybdis_helpers.ahk")
    Write-Host "Coach: $(if ($coach) { 'running' } else { 'stopped' })"
    Write-Host "Logger/beacon: $(if ($helper) { 'running' } else { 'stopped' })"
    if ($coach) { Write-Host "URL: http://127.0.0.1:$port/charybdis-coach/" }
}

function Set-StartupShortcut([bool]$Install) {
    $startup = [Environment]::GetFolderPath("Startup")
    $shortcutPath = Join-Path $startup "Portable Charybdis.lnk"
    if (-not $Install) {
        Remove-Item -LiteralPath $shortcutPath -Force -ErrorAction SilentlyContinue
        Write-Ok "Automatic startup removed."
        return
    }
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
    $shortcut.Arguments = '-NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $Root "Start-Charybdis.ps1") + '" -Action Start'
    $shortcut.WorkingDirectory = $Root
    $shortcut.Description = "Start portable Charybdis coach, logger, and beacon helper"
    $shortcut.Save()
    Write-Ok "Automatic startup installed for this Windows account."
}

try {
    $hasMutex = $mutex.WaitOne([TimeSpan]::FromSeconds(20))
    if (-not $hasMutex) { throw "Another portable Charybdis action is still running." }
    switch ($Action) {
        "Start" { Start-PortableStack }
        "Restart" { Stop-PortableStack; Start-Sleep -Milliseconds 500; Start-PortableStack }
        "Stop" { Stop-PortableStack }
        "Status" { Show-Status }
        "InstallStartup" { Set-StartupShortcut $true }
        "UninstallStartup" { Set-StartupShortcut $false }
    }
} finally {
    if ($hasMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
