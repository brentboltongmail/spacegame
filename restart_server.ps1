# Solaris Horizon: Emergence 3D Space Game - Server Manager Script
param (
    [int]$Port = 8088,
    [switch]$OpenBrowser
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Solaris Horizon Server Restarter (Port $Port)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Find and stop existing server processes
$killedAny = $false

# Method A: NetTCPConnection port check
try {
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                Write-Host "Stopping process on port $Port (PID: $pidToKill)..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                $killedAny = $true
            }
        }
    }
} catch {}

# Method B: Win32_Process command line check for python server
try {
    $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.py*" -or $_.CommandLine -like "*http.server*" }
    if ($procs) {
        foreach ($p in $procs) {
            Write-Host "Stopping Python server process (PID: $($p.ProcessId))..." -ForegroundColor Yellow
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
            $killedAny = $true
        }
    }
} catch {}

if ($killedAny) {
    Start-Sleep -Milliseconds 600
} else {
    Write-Host "No active server process found on port $Port." -ForegroundColor Gray
}

# 2. Launch fresh Python Astra server in background (detached process)
Write-Host "Starting Python HTTP server in background on port $Port..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /b python server.py" -WorkingDirectory $scriptDir -WindowStyle Hidden

# 3. Verify server status & open browser if requested
Start-Sleep -Milliseconds 800
try {
    $check = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($check) {
        Write-Host "SUCCESS: Solaris Horizon server is online at http://localhost:$Port" -ForegroundColor Green
    } else {
        Write-Host "SERVER LAUNCHED (PID $($serverProc.Id)) -> http://localhost:$Port" -ForegroundColor Green
    }
} catch {
    Write-Host "SERVER LAUNCHED (PID $($serverProc.Id)) -> http://localhost:$Port" -ForegroundColor Green
}

if ($OpenBrowser) {
    Start-Process "http://localhost:$Port"
}
