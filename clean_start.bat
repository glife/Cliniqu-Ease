@echo off
echo Cleaning up any existing processes...

REM Kill any processes using ports 8001, 8002, 8003, 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8002') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8003') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F 2>nul

echo Waiting 2 seconds for cleanup...
timeout /t 2 /nobreak >nul

echo Starting MedCare Backend...
start "Backend Server" cmd /k "python backend/main.py 8001 8001,8002,8003"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting MedCare Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo [SUCCESS] Both servers started!
echo Backend: http://127.0.0.1:8001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul
