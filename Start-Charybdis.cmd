@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Charybdis.ps1" %*
if errorlevel 1 pause
