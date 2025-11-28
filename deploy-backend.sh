#!/bin/bash

# Backend Deployment Script for Cloudflare Workers
# Usage: ./deploy-backend.sh [staging|production]
#
# This script deploys to environment-specific workers:
# - production -> boing-api-prod
# - staging -> boing-api-staging
#
# Note: The base "boing-api" worker is for local development only and should not be deployed.

set -e

ENVIRONMENT=${1:-production}

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    echo "Usage: ./deploy-backend.sh [staging|production]"
    exit 1
fi

echo "🚀 Deploying boing.finance backend to $ENVIRONMENT..."

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy to Cloudflare Workers
echo "☁️ Deploying to Cloudflare Workers ($ENVIRONMENT environment)..."
if [ "$ENVIRONMENT" = "staging" ]; then
    wrangler deploy --env staging
    echo "✅ Backend deployed successfully to staging!"
    echo "🌐 Staging API URL: https://boing-api-staging.nico-chikuji.workers.dev"
else
    wrangler deploy --env production
    echo "✅ Backend deployed successfully to production!"
    echo "🌐 Production API URL: https://boing-api-prod.nico-chikuji.workers.dev"
fi 