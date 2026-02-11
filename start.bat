@echo off
chcp 65001 >nul
title JNN Youth Centre Management System
echo ============================================
echo   JNN Youth Centre Management System
echo ============================================
echo.
echo Starting servers...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js found
echo.

:: Get the directory where this batch file is located
set "BASE_DIR=%~dp0"
cd /d "%BASE_DIR%"

:: Start Backend Server in new window
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%BASE_DIR%backend" && echo Installing backend dependencies... && npm install && echo. && echo Starting backend server... && node server.js"

:: Wait a bit for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend Server in new window
echo [2/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%BASE_DIR%frontend" && echo Installing frontend dependencies... && npm install && echo. && echo Starting frontend server... && npm run dev"

:: Wait for frontend to start
timeout /t 8 /nobreak >nul

:: Open browser
echo [3/3] Opening browser...
start http://localhost:3000/

echo.
echo ============================================
echo   All servers started successfully!
echo ============================================
echo.
echo Backend: http://localhost:5173
echo Frontend: http://localhost:3001/
echo.
echo You can close this window now.
echo The servers will continue running.
echo.
pause
