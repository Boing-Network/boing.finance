@echo off
REM Base App Mini App Integration Setup Script for Windows
REM This script helps set up Boing Finance for Base App integration

echo 🚀 Setting up Boing Finance for Base App integration...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Check if @base/minikit was installed
call npm list @base/minikit >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Base MiniApp SDK installed successfully
) else (
    echo ❌ Error: Failed to install Base MiniApp SDK
    echo Please run: npm install @base/minikit
    pause
    exit /b 1
)

REM Verify manifest file exists
if exist "public\.well-known\farcaster.json" (
    echo ✅ Manifest file found
) else (
    echo ❌ Error: Manifest file not found
    echo Please ensure public\.well-known\farcaster.json exists
    pause
    exit /b 1
)

REM Check if Base network is configured
findstr /C:"8453" src\config\networks.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Base network configured
) else (
    echo ❌ Error: Base network not found in networks.js
    echo Please ensure Base network (Chain ID 8453) is configured
    pause
    exit /b 1
)

REM Build the project to check for errors
echo 🔨 Building project...
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Project builds successfully
) else (
    echo ❌ Error: Project build failed
    echo Please check for build errors and fix them
    pause
    exit /b 1
)

echo.
echo 🎉 Base App integration setup complete!
echo.
echo Next steps:
echo 1. Deploy your app to your hosting platform
echo 2. Verify the manifest is accessible at: https://your-domain.com/.well-known/farcaster.json
echo 3. Test the app in Base App development environment
echo 4. Submit to Base Build dashboard
echo.
echo For more information, see: BASE_APP_INTEGRATION.md
pause
