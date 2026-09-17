@echo off
echo ===================================
echo   Prime Design - local check
echo ===================================
echo.

echo Pulling latest changes from GitHub...
git pull origin main
if errorlevel 1 (
    echo.
    echo Git pull failed - resolve this before continuing.
    echo Read the message above for details.
    pause
    exit /b 1
)

echo.
echo Installing dependencies (skips quickly if nothing changed)...
call npm install
if errorlevel 1 (
    echo.
    echo npm install failed - see the error above.
    pause
    exit /b 1
)

echo.
echo Starting local dev server...
echo.
echo Once it's running, two links will print below:
echo   - Local:   open this on THIS computer
echo   - Network: open this on your phone/tablet, if it's on the same Wi-Fi
echo.
echo Press Ctrl+C in this window to stop the server when you're done.
echo.
call npm run dev -- --host

pause
