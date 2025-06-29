#!/bin/bash

# Frontend Deployment Script for Cloudflare Pages
# Usage: ./deploy-frontend.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="boing-finance"

echo "🚀 Deploying boing.finance frontend to $ENVIRONMENT..."

# Build the project
echo "📦 Building frontend..."
if [ "$ENVIRONMENT" = "staging" ]; then
    npm run build:staging
else
    npm run build:prod
fi

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
if [ "$ENVIRONMENT" = "staging" ]; then
    wrangler pages deploy build --project-name=$PROJECT_NAME --branch=staging
else
    wrangler pages deploy build --project-name=$PROJECT_NAME --branch=main
fi

echo "✅ Frontend deployed successfully!"
echo "🌐 URL: https://$PROJECT_NAME.pages.dev" 