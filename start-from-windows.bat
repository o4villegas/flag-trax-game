@echo off
echo =====================================
echo  WSL2 Flag-Trax-Game Server Launcher
echo =====================================
echo.

REM Check if WSL is running
wsl --status > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: WSL is not installed or not running
    echo Please install WSL2 from Microsoft Store
    pause
    exit /b 1
)

echo Starting Flag-Trax-Game server in WSL2...
echo.
echo Access the app at:
echo   - http://localhost:5173
echo   - http://127.0.0.1:5173
echo.
echo Press Ctrl+C to stop the server
echo =====================================
echo.

REM Start the server in WSL
wsl -d Ubuntu -- bash -c "cd ~/flag-trax-game && npm run dev:wsl"

pause
