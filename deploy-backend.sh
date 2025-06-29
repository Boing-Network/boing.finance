#!/bin/bash

# Backend Deployment Script for Cloudflare Workers
# Usage: ./deploy-backend.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying boing.finance backend to $ENVIRONMENT..."

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy to Cloudflare Workers
echo "☁️ Deploying to Cloudflare Workers..."
if [ "$ENVIRONMENT" = "staging" ]; then
    wrangler deploy --env staging
else
    wrangler deploy --env production
fi

echo "✅ Backend deployed successfully!"
echo "🌐 API URL: https://boing-api.your-subdomain.workers.dev" 