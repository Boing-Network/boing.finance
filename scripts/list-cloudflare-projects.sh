#!/bin/bash

# Script to list all Cloudflare Pages projects
# This helps identify which projects exist and which ones might be unused

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Cloudflare Pages Projects Check${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler is not installed. Installing...${NC}"
    npm install -g wrangler@latest
fi

# Expected projects
EXPECTED_PROJECTS=("boing-finance-prod" "boing-finance")

echo -e "${GREEN}✅ Expected Projects:${NC}"
for project in "${EXPECTED_PROJECTS[@]}"; do
    echo "   - $project"
done

echo ""
echo -e "${BLUE}📋 To view all your Cloudflare Pages projects:${NC}"
echo ""
echo "1. Go to: https://dash.cloudflare.com/?to=/:account/workers/pages"
echo "2. Review all projects listed"
echo "3. Identify projects that are NOT in the expected list above"
echo "4. Delete unused projects (see CLOUDFLARE_CLEANUP_GUIDE.md)"
echo ""

# Try to list projects using wrangler (if authenticated)
if wrangler whoami &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
    echo ""
    echo "Attempting to list projects..."
    echo ""
    # Note: wrangler doesn't have a direct command to list all Pages projects
    # We'll provide manual instructions
    echo -e "${YELLOW}Note: Wrangler doesn't support listing all Pages projects directly.${NC}"
    echo "Please use the Cloudflare Dashboard link above to view all projects."
else
    echo -e "${YELLOW}⚠️  Not authenticated. To authenticate:${NC}"
    echo "   Run: wrangler login"
    echo ""
    echo "Or use the Cloudflare Dashboard link above."
fi

echo ""
echo -e "${BLUE}📝 Cleanup Instructions:${NC}"
echo ""
echo "After viewing your projects in the dashboard:"
echo "1. Keep only these projects:"
for project in "${EXPECTED_PROJECTS[@]}"; do
    echo "   ✅ $project"
done
echo ""
echo "2. Delete any other Pages projects"
echo "3. See CLOUDFLARE_CLEANUP_GUIDE.md for detailed steps"
echo ""

