# Cloudflare Pages Cleanup Guide

## Overview

This guide helps you identify and remove unused Cloudflare Pages projects to keep your account clean and organized.

## Expected Projects

After setup, you should have exactly **2** Cloudflare Pages projects:

1. **`boing-finance-prod`** - Production environment (deployed from `main` branch)
2. **`boing-finance`** - Staging environment (deployed from `staging` branch)

## How to Check for Unused Projects

### Method 1: Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Review all projects listed
4. Identify projects that are **NOT** in the expected list above

### Method 2: Using the Cleanup Script

```bash
cd dex
chmod +x scripts/cleanup-cloudflare-pages.sh
./scripts/cleanup-cloudflare-pages.sh
```

## How to Remove Unused Projects

### Step-by-Step Instructions

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Navigate to **Workers & Pages** → **Pages**

2. **Identify Unused Projects**
   - Look for projects that are NOT:
     - `boing-finance-prod`
     - `boing-finance`
   - Common unused project names might be:
     - `boing-finance-old`
     - `boing-finance-test`
     - `boing-finance-dev`
     - Any other variations

3. **Delete Unused Projects**
   - Click on the unused project
   - Go to **Settings** tab
   - Scroll down to **Delete Project** section
   - Click **Delete Project**
   - Type the project name to confirm
   - Click **Delete**

4. **Verify Clean State**
   - You should now have exactly 2 projects:
     - `boing-finance-prod`
     - `boing-finance`

## Auto-Creation of Projects

The GitHub Actions workflow is configured to **auto-create** projects if they don't exist:

- When you push to `main` branch → Creates/deploys to `boing-finance-prod`
- When you push to `staging` branch → Creates/deploys to `boing-finance`

### Requirements for Auto-Creation

Your `CLOUDFLARE_API_TOKEN` must have:
- ✅ **Cloudflare Pages:Edit** permission
- ✅ **Account** scope (not just specific resources)

If auto-creation fails, you'll see an error in GitHub Actions. In that case:
1. Check your API token permissions
2. Or create the projects manually (see `CLOUDFLARE_PAGES_SETUP.md`)

## Verification Checklist

After cleanup, verify:

- [ ] Only 2 Pages projects exist: `boing-finance-prod` and `boing-finance`
- [ ] No old/unused projects remain
- [ ] Both projects are accessible:
  - Production: https://boing-finance-prod.pages.dev
  - Staging: https://boing-finance.pages.dev

## Troubleshooting

### "Project not found" Error

If you see this error in GitHub Actions:
- The project doesn't exist yet
- The workflow will try to auto-create it
- If auto-creation fails, check API token permissions

### "Permission denied" Error

Your API token needs:
- **Cloudflare Pages:Edit** permission
- **Account** scope (not resource-specific)

### Can't Delete a Project

- Make sure you're the account owner or have admin permissions
- Some projects might be protected - check project settings
- Contact Cloudflare support if you can't delete a project

## Maintenance

### Regular Cleanup

It's good practice to review your Cloudflare Pages projects periodically:

1. **Monthly Review**: Check for unused projects
2. **After Major Changes**: Clean up test/staging projects
3. **Before Important Deployments**: Ensure only expected projects exist

### Best Practices

- ✅ Use consistent naming: `project-name-prod` and `project-name`
- ✅ Document all active projects
- ✅ Remove test projects after testing
- ✅ Keep production and staging separate
- ❌ Don't create multiple production projects
- ❌ Don't leave old/unused projects

## Related Documentation

- `CLOUDFLARE_PAGES_SETUP.md` - Initial setup guide
- `DEPLOYMENT_SETUP.md` - Deployment configuration
- `.github/workflows/deploy-frontend.yml` - GitHub Actions workflow

## Need Help?

If you encounter issues:
1. Check the GitHub Actions logs for specific errors
2. Verify API token permissions in Cloudflare Dashboard
3. Review project settings in Cloudflare Dashboard
4. Check this guide and related documentation

