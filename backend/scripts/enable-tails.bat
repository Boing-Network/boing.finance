@echo off
REM Script to enable Wrangler tails for backend logging (Windows)
REM This will stream real-time logs from the Cloudflare Worker

echo 🔍 Enabling Wrangler tails for backend logging...
echo.
echo This will stream real-time logs from your Cloudflare Worker.
echo Press Ctrl+C to stop.
echo.

REM Check if wrangler is installed
where wrangler >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: wrangler CLI is not installed.
    echo Install it with: npm install -g wrangler
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0.."

REM Check if wrangler.toml exists
if not exist "wrangler.toml" (
    echo ❌ Error: wrangler.toml not found in backend directory
    exit /b 1
)

REM boing-api-prod is the only deployed Worker (boing-api / boing-api-staging were deleted)
set ENV=production
set WORKER_NAME=boing-api-prod

echo.
echo 📡 Starting tail for: %WORKER_NAME%
echo.

REM Start tailing
wrangler tail --env %ENV% --format pretty

