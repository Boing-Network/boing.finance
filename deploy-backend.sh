#!/bin/bash

# Backend Deployment Script for Cloudflare Workers
# Usage: ./deploy-backend.sh [production]
#
# Production is the only deployed environment: boing-api-prod (--env production).
# The former "boing-api" (base, local-dev only) and "boing-api-staging" Workers were
# deleted from Cloudflare; the base worker must not be deployed.

set -e

ENVIRONMENT=${1:-production}

# Validate environment
if [ "$ENVIRONMENT" != "production" ]; then
    echo "Error: Only the 'production' environment exists (boing-api-staging was deleted)"
    echo "Usage: ./deploy-backend.sh [production]"
    exit 1
fi

echo "Deploying boing.finance backend to $ENVIRONMENT..."

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Deploy to Cloudflare Workers
echo "Deploying to Cloudflare Workers ($ENVIRONMENT environment)..."
wrangler deploy --env production
echo "Backend deployed successfully to production!"
echo "Production API URL: https://boing-api-prod.nico-chikuji.workers.dev"
