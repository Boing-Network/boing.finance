#!/bin/bash

# Script to enable Wrangler tails for backend logging
# This will stream real-time logs from the Cloudflare Worker

echo "🔍 Enabling Wrangler tails for backend logging..."
echo ""
echo "This will stream real-time logs from your Cloudflare Worker."
echo "Press Ctrl+C to stop."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed."
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/.." || exit

# Check if wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found in backend directory"
    exit 1
fi

# boing-api-prod is the only deployed Worker (boing-api / boing-api-staging were deleted)
ENV="production"
WORKER_NAME="boing-api-prod"

echo ""
echo "📡 Starting tail for: $WORKER_NAME"
echo ""

# Start tailing
wrangler tail --env "$ENV" --format pretty

