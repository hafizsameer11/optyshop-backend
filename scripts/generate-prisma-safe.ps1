# PowerShell script to safely generate Prisma Client
# This script stops Node processes, generates Prisma, and provides next steps
# Usage: .\scripts\generate-prisma-safe.ps1

Write-Host "🔄 Safe Prisma Client Generation" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Check for running Node processes
Write-Host "Step 1: Checking for running Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "⚠️  Found $($nodeProcesses.Count) running Node.js process(es)" -ForegroundColor Yellow
    Write-Host "These processes might lock Prisma files.`n" -ForegroundColor Yellow
    
    # Try to find if any are from this project
    $projectProcesses = $nodeProcesses | Where-Object { 
        $_.Path -like "*OPTshop*" -or 
        (Get-Process -Id $_.Id -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path) -like "*OPTshop*"
    }
    
    if ($projectProcesses) {
        Write-Host "Stopping project-related processes..." -ForegroundColor Yellow
        $projectProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Step 2: Try to delete the .prisma folder if it exists
Write-Host "`nStep 2: Cleaning Prisma cache..." -ForegroundColor Yellow
$prismaClientPath = Join-Path $PSScriptRoot "..\node_modules\.prisma"
if (Test-Path $prismaClientPath) {
    try {
        Remove-Item -Path $prismaClientPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Cleaned Prisma cache" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } catch {
        Write-Host "⚠️  Could not fully clean cache (this is okay if files are in use)" -ForegroundColor Yellow
    }
}

# Step 3: Generate Prisma Client
Write-Host "`nStep 3: Generating Prisma Client..." -ForegroundColor Yellow
try {
    Set-Location (Join-Path $PSScriptRoot "..")
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Prisma Client generated successfully!" -ForegroundColor Green
        Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Restart your application" -ForegroundColor White
        Write-Host "   2. Test the banners endpoint" -ForegroundColor White
        Write-Host "   3. Run 'npm run verify-banner-fix' to verify everything works" -ForegroundColor White
    } else {
        Write-Host "`n❌ Prisma generation failed. Try:" -ForegroundColor Red
        Write-Host "   1. Close all terminals running your app" -ForegroundColor Yellow
        Write-Host "   2. Close your IDE/editor" -ForegroundColor Yellow
        Write-Host "   3. Run this script again" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    Write-Host "`n💡 Try closing all Node.js processes and IDE, then run again" -ForegroundColor Yellow
}
