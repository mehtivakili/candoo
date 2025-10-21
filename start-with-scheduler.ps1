Write-Host "🚀 Starting Snapp Food Scraper with Automatic Scheduler..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host "📋 Checking PM2 status..." -ForegroundColor Yellow
pm2 status

Write-Host ""
Write-Host "🔄 Stopping existing processes..." -ForegroundColor Yellow
pm2 stop all

Write-Host ""
Write-Host "🚀 Starting application with PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

Write-Host ""
Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🔍 Checking scheduler status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/price-update" -Method GET
    Write-Host "✅ Scheduler API responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Scheduler API not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Checking PM2 logs..." -ForegroundColor Yellow
pm2 logs --lines 20

Write-Host ""
Write-Host "✅ Startup completed! Check the logs above for scheduler status." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "   pm2 logs candoo -f          (follow logs)" -ForegroundColor White
Write-Host "   pm2 restart candoo           (restart app)" -ForegroundColor White
Write-Host "   pm2 stop candoo             (stop app)" -ForegroundColor White
Write-Host "   pm2 status                   (check status)" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue..."


