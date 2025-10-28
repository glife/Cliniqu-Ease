@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
title MedCare - Unified Start

echo ========================================
echo    MedCare Healthcare Management System
echo        Unified Start Script
echo ========================================
echo.

REM Kill anything left from previous runs on ports 8001-8004 and 3000
for %%P in (8001 8002 8003 8004 3000) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    echo Killing PID %%a on port %%P
    taskkill /F /PID %%a >nul 2>&1
  )
)

echo.
echo Starting Backend Servers...
echo.

echo Starting Backend Server 1 (Port 8001)...
start "Backend 8001" cmd /k "python backend\main.py 8001 8001,8002,8003"
timeout /t 4 /nobreak >nul

echo Starting Backend Server 2 (Port 8002)...
start "Backend 8002" cmd /k "python backend\main.py 8002 8001,8002,8003"
timeout /t 2 /nobreak >nul

echo Starting Backend Server 3 (Port 8003)...
start "Backend 8003" cmd /k "python backend\main.py 8003 8001,8002,8003"
timeout /t 2 /nobreak >nul

echo Starting API Gateway (Port 8004)...
start "API Gateway" cmd /k "python -m uvicorn backend.gateway:app --host 127.0.0.1 --port 8004 --reload"
timeout /t 4 /nobreak >nul

echo Verifying API Gateway health...
curl -s http://127.0.0.1:8004/health >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARNING] Gateway not healthy yet. Waiting a bit more...
  timeout /t 3 /nobreak >nul
)

echo Starting Frontend Dev Server (Vite)...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo Running smoke tests against the Gateway...
python test_api.py

echo.
echo ========================================
echo Services Started
echo ========================================
echo Backend Servers:  http://127.0.0.1:8001 , 8002 , 8003
echo API Gateway:      http://127.0.0.1:8004
echo Frontend:         http://localhost:3000
echo.
echo Close this window to stop only this launcher. Use the opened windows to view logs.
echo.
pause
