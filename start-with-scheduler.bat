@echo off
echo 🚀 Starting Snapp Food Scraper with Automatic Scheduler...
echo ========================================================

echo 📋 Checking PM2 status...
pm2 status

echo.
echo 🔄 Stopping existing processes...
pm2 stop all

echo.
echo 🚀 Starting application with PM2...
pm2 start ecosystem.config.js

echo.
echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak

echo.
echo 🔍 Checking scheduler status...
curl.exe -s http://localhost:3001/api/price-update

echo.
echo 📊 Checking PM2 logs...
pm2 logs --lines 20

echo.
echo ✅ Startup completed! Check the logs above for scheduler status.
echo.
echo 📝 Useful commands:
echo    pm2 logs candoo -f          (follow logs)
echo    pm2 restart candoo           (restart app)
echo    pm2 stop candoo             (stop app)
echo    pm2 status                   (check status)
echo.
pause


