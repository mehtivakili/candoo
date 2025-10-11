@echo off
REM Automated Database Setup Script for Windows
REM This script runs the Node.js database setup

echo ========================================
echo   Candoo Database Setup
echo ========================================
echo.
echo This will:
echo   1. Create 'candoo' database
echo   2. Create 'menus' table
echo   3. Set up indexes and triggers
echo   4. Test the connection
echo.
echo ========================================
echo.

REM Run the Node.js setup script
node scripts/setup-database.js

echo.
pause

