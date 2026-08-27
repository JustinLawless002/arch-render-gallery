@echo off
setlocal

cd /d "%~dp0"

echo ================================
echo   Prime Design - Deploy Script
echo ================================
echo.

echo Staging changes...
git add .

git diff --cached --quiet
if %errorlevel% equ 0 (
    echo.
    echo No changes to commit - everything is already up to date.
    echo.
    pause
    exit /b 0
)

echo.
set /p commitmsg="Describe what changed (or press Enter for a default message): "
if "%commitmsg%"=="" set commitmsg=Update site

echo.
echo Committing...
git commit -m "%commitmsg%"
if %errorlevel% neq 0 (
    echo.
    echo Commit failed - check the messages above.
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push
if %errorlevel% neq 0 (
    echo.
    echo Push failed - check the messages above.
    echo ^(Common causes: a file over 100MB, or no internet connection.^)
    pause
    exit /b 1
)

echo.
echo ================================
echo   Done! Vercel is now building and deploying automatically.
echo   Check vercel.com for progress, or visit primedesign.design
echo   in a minute or two once the build finishes.
echo ================================
echo.
pause
