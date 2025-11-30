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

# Ask which environment to tail
echo "Select environment to tail:"
echo "1) Production (boing-api-prod)"
echo "2) Staging (boing-api-staging)"
echo "3) Development (boing-api)"
read -p "Enter choice [1-3]: " env_choice

case $env_choice in
    1)
        ENV="production"
        WORKER_NAME="boing-api-prod"
        ;;
    2)
        ENV="staging"
        WORKER_NAME="boing-api-staging"
        ;;
    3)
        ENV=""
        WORKER_NAME="boing-api"
        ;;
    *)
        echo "Invalid choice. Defaulting to staging."
        ENV="staging"
        WORKER_NAME="boing-api-staging"
        ;;
esac

echo ""
echo "📡 Starting tail for: $WORKER_NAME"
echo ""

# Start tailing
if [ -z "$ENV" ]; then
    wrangler tail --format pretty
else
    wrangler tail --env "$ENV" --format pretty
fi

