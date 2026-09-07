@echo off
setlocal EnableDelayedExpansion

title Speed Math Server - localhost:3000
color 0A

:: Ensure Node.js is in PATH
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%AppData%\npm;%LocalAppData%\Programs\nodejs"

:: Navigate to project directory
cd /d "%~dp0"
if exist "speed-math-fullstack\package.json" (
    cd /d "%~dp0speed-math-fullstack"
)

cls
echo ========================================================
echo   Speed Math Fullstack Application Launcher
echo ========================================================
echo.
echo Current Directory: %CD%
echo.

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] Node.js is not found on your system.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
echo.

:: Check node_modules
if not exist "node_modules" (
    echo [INFO] Installing project dependencies...
    call npm install
    if errorlevel 1 (
        color 0C
        echo [ERROR] Failed to run npm install.
        pause
        exit /b 1
    )
)

:: Launch browser in 2 seconds in the background
echo [INFO] Opening browser at http://localhost:3000
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"

:: Start the application
echo.
echo ========================================================
echo   Server starting at http://localhost:3000
echo   Keep this window open while using the application.
echo   Press Ctrl + C to stop the server.
echo ========================================================
echo.

node src/index.js

echo.
echo Server stopped.
pause
