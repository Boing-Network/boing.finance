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

REM Ask which environment to tail
echo Select environment to tail:
echo 1) Production (boing-api-prod)
echo 2) Staging (boing-api-staging)
echo 3) Development (boing-api)
set /p env_choice="Enter choice [1-3]: "

if "%env_choice%"=="1" (
    set ENV=production
    set WORKER_NAME=boing-api-prod
) else if "%env_choice%"=="2" (
    set ENV=staging
    set WORKER_NAME=boing-api-staging
) else if "%env_choice%"=="3" (
    set ENV=
    set WORKER_NAME=boing-api
) else (
    echo Invalid choice. Defaulting to staging.
    set ENV=staging
    set WORKER_NAME=boing-api-staging
)

echo.
echo 📡 Starting tail for: %WORKER_NAME%
echo.

REM Start tailing
if "%ENV%"=="" (
    wrangler tail --format pretty
) else (
    wrangler tail --env %ENV% --format pretty
)

