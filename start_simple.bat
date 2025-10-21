@echo off
echo Starting MedCare Backend...
start "Backend Server" cmd /k "python backend/main.py 8001 8001,8002,8003"
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
