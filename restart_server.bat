@echo off
title Solaris Horizon Server Restarter
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart_server.ps1" -OpenBrowser
ping -n 3 127.0.0.1 >nul
