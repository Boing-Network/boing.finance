#!/bin/bash

echo "🚀 Deploying Boing Finance to Cloudflare Pages..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy build --project-name=boing-finance

echo "✅ Deployment complete!"
echo "🌍 Your site is live at: https://boing.finance"
echo "🔗 Pages URL: https://144e6ec9.boing-finance.pages.dev" 