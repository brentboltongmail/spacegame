@echo off
title Solaris Horizon Server Restarter
cd /d "%~dp0"

echo ==========================================
echo   Solaris Horizon Server Restarter (8088)
echo ==========================================

:: 1. Stop existing server process on port 8088
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8088 ^| findstr LISTENING') do (
    echo Stopping process PID %%a on port 8088...
    taskkill /F /PID %%a >nul 2>&1
)

ping -n 2 127.0.0.1 >nul

:: 2. Launch fresh Python server in a new window
echo Starting Python server on http://localhost:8088...
start "Solaris Horizon Server" python server.py

ping -n 2 127.0.0.1 >nul

:: 3. Open browser
echo Opening browser at http://localhost:8088...
start http://localhost:8088

echo.
echo SUCCESS: Solaris Horizon server is online at http://localhost:8088!
