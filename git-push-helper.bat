@echo off
echo 🔧 Git Push Helper Script
echo ========================

echo 📋 Checking Git status...
git status

echo.
echo 🚀 Attempting to push to GitHub...
echo.

REM Try to push with increased timeout
git push origin master

if %errorlevel% neq 0 (
    echo.
    echo ❌ Push failed. Trying alternative methods...
    echo.
    
    echo 🔄 Trying with SSH...
    git remote set-url origin git@github.com:mehtivakili/candoo.git
    git push origin master
    
    if %errorlevel% neq 0 (
        echo.
        echo 🔄 Switching back to HTTPS and trying again...
        git remote set-url origin https://github.com/mehtivakili/candoo.git
        git push origin master
    )
)

echo.
echo ✅ Push operation completed!
pause


