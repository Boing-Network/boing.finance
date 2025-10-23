#!/bin/bash

# Base App Mini App Integration Setup Script
# This script helps set up Boing Finance for Base App integration

echo "🚀 Setting up Boing Finance for Base App integration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if @base/minikit was installed
if npm list @base/minikit > /dev/null 2>&1; then
    echo "✅ Base MiniApp SDK installed successfully"
else
    echo "❌ Error: Failed to install Base MiniApp SDK"
    echo "Please run: npm install @base/minikit"
    exit 1
fi

# Verify manifest file exists
if [ -f "public/.well-known/farcaster.json" ]; then
    echo "✅ Manifest file found"
else
    echo "❌ Error: Manifest file not found"
    echo "Please ensure public/.well-known/farcaster.json exists"
    exit 1
fi

# Verify manifest file is valid JSON
if python -m json.tool public/.well-known/farcaster.json > /dev/null 2>&1; then
    echo "✅ Manifest file is valid JSON"
else
    echo "❌ Error: Manifest file contains invalid JSON"
    echo "Please check the manifest file format"
    exit 1
fi

# Check if Base network is configured
if grep -q "8453" src/config/networks.js; then
    echo "✅ Base network configured"
else
    echo "❌ Error: Base network not found in networks.js"
    echo "Please ensure Base network (Chain ID 8453) is configured"
    exit 1
fi

# Build the project to check for errors
echo "🔨 Building project..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Project builds successfully"
else
    echo "❌ Error: Project build failed"
    echo "Please check for build errors and fix them"
    exit 1
fi

echo ""
echo "🎉 Base App integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your app to your hosting platform"
echo "2. Verify the manifest is accessible at: https://your-domain.com/.well-known/farcaster.json"
echo "3. Test the app in Base App development environment"
echo "4. Submit to Base Build dashboard"
echo ""
echo "For more information, see: BASE_APP_INTEGRATION.md"
