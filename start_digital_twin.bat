@echo off
title Pradhikaran 3D Urban Digital Twin Launcher
echo =====================================================================
echo    Launching Pradhikaran 3D Urban Digital Twin (PCCOE Testbed)
echo =====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Starting Backend API Server (Port 3001)...
start "Digital Twin Backend API" cmd /k "npm --workspace=apps/api run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting 3D Web Application (CesiumJS on Port 5173)...
start "Digital Twin 3D Web UI" cmd /k "npm --workspace=apps/web run dev"

timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo    Opening http://localhost:5173 in your default browser...
echo =====================================================================
start http://localhost:5173

pause
