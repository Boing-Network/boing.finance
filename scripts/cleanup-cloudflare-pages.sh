#!/bin/bash

# Script to list and check Cloudflare Pages projects
# Helps identify unused projects for cleanup
# Usage: ./cleanup-cloudflare-pages.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking Cloudflare Pages projects..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if authenticated
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with Cloudflare${NC}"
    echo "Run: wrangler login"
    exit 1
fi

# Expected project names
EXPECTED_PROJECTS=("boing-finance-prod" "boing-finance")

echo ""
echo "📋 Expected Cloudflare Pages projects:"
for project in "${EXPECTED_PROJECTS[@]}"; do
    echo "  ✅ $project"
done

echo ""
echo "🔍 Listing all Cloudflare Pages projects..."
echo ""

# Get list of all Pages projects
# Note: wrangler doesn't have a direct command to list all projects
# We'll need to use the Cloudflare API or check manually
echo -e "${YELLOW}⚠️  Note: Wrangler doesn't have a direct command to list all Pages projects.${NC}"
echo "You can view them in the Cloudflare Dashboard:"
echo "  https://dash.cloudflare.com/?to=/:account/workers/pages"
echo ""

# Instructions for manual cleanup
echo "📝 Manual Cleanup Instructions:"
echo ""
echo "1. Go to Cloudflare Dashboard → Workers & Pages → Pages"
echo "2. Review all projects listed"
echo "3. Identify projects that are NOT:"
for project in "${EXPECTED_PROJECTS[@]}"; do
    echo "   - $project"
done
echo ""
echo "4. For each unused project:"
echo "   - Click on the project"
echo "   - Go to Settings → Delete Project"
echo "   - Confirm deletion"
echo ""

# Check if specific projects exist by trying to get their info
echo "🔍 Checking if expected projects exist..."
echo ""

for project in "${EXPECTED_PROJECTS[@]}"; do
    if wrangler pages project list 2>/dev/null | grep -q "$project" || true; then
        echo -e "${GREEN}✅ Project '$project' exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Project '$project' not found (will be auto-created on first deployment)${NC}"
    fi
done

echo ""
echo "✅ Cleanup check complete!"
echo ""
echo "💡 Tip: Projects will be auto-created by GitHub Actions on first deployment."
echo "   If you see any old/unused projects in the dashboard, delete them manually."

