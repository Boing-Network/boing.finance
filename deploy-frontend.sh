#!/bin/bash

# Frontend Deployment Script for Cloudflare Pages
# Usage: ./deploy-frontend.sh [staging|production]
#
# This script builds and deploys the frontend to Cloudflare Pages.
# For automated deployments, use GitHub Actions workflows instead.

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="boing-finance"

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    echo "Usage: ./deploy-frontend.sh [staging|production]"
    exit 1
fi

echo "🚀 Deploying boing.finance frontend to $ENVIRONMENT..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "📦 Building frontend..."
if [ "$ENVIRONMENT" = "staging" ]; then
    npm run build:staging
    PROJECT_NAME="boing-finance"
else
    npm run build:prod
    PROJECT_NAME="boing-finance-prod"
fi

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
if [ "$ENVIRONMENT" = "staging" ]; then
    wrangler pages deploy build --project-name=$PROJECT_NAME --branch=staging
    echo "✅ Frontend deployed successfully to staging!"
    echo "🌐 Staging URL: https://boing-finance.pages.dev"
else
    wrangler pages deploy build --project-name=$PROJECT_NAME --branch=main
    echo "✅ Frontend deployed successfully to production!"
    echo "🌐 Production URL: https://boing-finance-prod.pages.dev"
fi 