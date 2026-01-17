# Emergency restart script for Windows
# Apply banner fix and restart server

Write-Host "🚨 EMERGENCY: Applying banner fix and restarting server..." -ForegroundColor Red

# Apply banner column fix
Write-Host "📋 Applying banner column fix..." -ForegroundColor Yellow
$npx prisma db execute --stdin @"
ALTER TABLE banners ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';
ALTER TABLE banners ADD COLUMN category_id INTEGER NULL;
ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL;
"@

# Force regenerate Prisma Client
Write-Host "🔄 Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate --force

# Find and kill the server process
Write-Host "🔄 Restarting server..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*server*"} | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Start server
Write-Host "🎯 Starting server..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden

Write-Host "✅ Emergency fix applied and server restarted!" -ForegroundColor Green
