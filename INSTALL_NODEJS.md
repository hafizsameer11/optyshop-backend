# Install Node.js on Windows

## Quick Installation Guide

Your project requires **Node.js >= 18.0.0** and **npm >= 9.0.0**.

### Option 1: Direct Download (Recommended)

1. **Download Node.js LTS version:**
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (currently 20.x or 22.x)
   - Choose the Windows Installer (.msi) for your system (64-bit recommended)

2. **Run the installer:**
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - **Important:** Make sure to check "Add to PATH" during installation
   - Complete the installation

3. **Restart your terminal/PowerShell:**
   - Close and reopen PowerShell or Cursor
   - This ensures the PATH is updated

4. **Verify installation:**
   ```powershell
   node --version
   npm --version
   ```

### Option 2: Using Chocolatey (If you have it installed)

```powershell
choco install nodejs-lts
```

### Option 3: Using winget (Windows Package Manager)

```powershell
winget install OpenJS.NodeJS.LTS
```

### After Installation

1. **Restart your terminal/PowerShell**
2. **Navigate to your project:**
   ```powershell
   cd D:\OPTshop\backend
   ```

3. **Install dependencies:**
   ```powershell
   npm install
   ```

4. **Run the development server:**
   ```powershell
   npm run dev
   ```

## Troubleshooting

If `node` or `npm` commands still don't work after installation:

1. **Check if Node.js is installed:**
   ```powershell
   Test-Path "C:\Program Files\nodejs\node.exe"
   ```

2. **If it exists but still not working, refresh PATH:**
   ```powershell
   $env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

3. **Or manually add to PATH:**
   - Open System Properties → Environment Variables
   - Add `C:\Program Files\nodejs\` to your User PATH variable
   - Restart terminal

## Verify Installation

After installation, run these commands to verify:

```powershell
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```















