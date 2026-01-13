@echo off
echo Stopping Node processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *" /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo Cleaning Prisma cache...
if exist "node_modules\.prisma" (
    rd /s /q "node_modules\.prisma" >nul 2>&1
)

echo Generating Prisma Client...
call npx prisma generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Prisma Client generated.
    echo Please restart your application.
) else (
    echo.
    echo Generation failed. Please:
    echo 1. Close Cursor/VS Code completely
    echo 2. Close all Node.js processes
    echo 3. Run this script again as Administrator
)

pause
