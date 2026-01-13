# PowerShell script to stop Node.js processes that might be locking Prisma files
# Usage: .\scripts\stop-node-processes.ps1

Write-Host "🛑 Stopping Node.js processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es):" -ForegroundColor Cyan
    $nodeProcesses | Format-Table Id, ProcessName, Path -AutoSize
    
    $response = Read-Host "Do you want to stop all Node.js processes? (Y/N)"
    
    if ($response -eq 'Y' -or $response -eq 'y') {
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ All Node.js processes stopped" -ForegroundColor Green
        Start-Sleep -Seconds 2
        Write-Host "You can now run: npx prisma generate" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Cancelled. Please stop the processes manually or close the terminal running your app." -ForegroundColor Red
    }
} else {
    Write-Host "✅ No Node.js processes found" -ForegroundColor Green
}
