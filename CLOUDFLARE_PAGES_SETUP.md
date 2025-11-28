# Cloudflare Pages Project Setup

## Issue: Projects Don't Exist

The GitHub Actions workflow is trying to deploy to Cloudflare Pages projects that don't exist yet:
- `boing-finance-prod` (for production)
- `boing-finance` (for staging)

## Solution: Auto-Create Projects (Recommended)

### ✅ Option 1: Let Wrangler Auto-Create (Recommended)

The GitHub Actions workflow is configured to **automatically create** projects when deploying:

- ✅ Projects are created automatically by `wrangler pages deploy`
- ✅ No manual setup required
- ✅ First deployment will create the project if it doesn't exist

**Requirements:**
- Your `CLOUDFLARE_API_TOKEN` must have **Cloudflare Pages:Edit** permission
- Token must have **Account** scope (not resource-specific)

**How it works:**
- Push to `main` branch → Creates/deploys to `boing-finance-prod`
- Push to `staging` branch → Creates/deploys to `boing-finance`

### Option 2: Create Projects Manually (If Auto-Creation Fails)

If auto-creation doesn't work, create projects manually:

#### Via Cloudflare Dashboard:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Create a project**
4. Choose **Upload assets**
5. Set project name: `boing-finance-prod` or `boing-finance`
6. Click **Create project**

#### Via Wrangler CLI:
```bash
# Create production project
wrangler pages project create boing-finance-prod

# Create staging project
wrangler pages project create boing-finance
```

## Verify Projects Exist

After creating the projects, verify they exist:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. You should see both projects listed:
   - `boing-finance-prod`
   - `boing-finance`

## After Creating Projects

Once the projects are created, the GitHub Actions workflow should work correctly. The next push to `main` or `staging` will deploy successfully.

## Troubleshooting

### Error: "Project not found"
- The project doesn't exist yet - create it using one of the options above

### Error: "Permission denied"
- Your API token needs **Cloudflare Pages:Edit** permission
- Regenerate the token with correct permissions

### Error: "Account ID mismatch"
- Verify `CLOUDFLARE_ACCOUNT_ID` secret is correct
- Get it from Cloudflare Dashboard sidebar

## Project URLs

After successful deployment:
- **Production**: https://boing-finance-prod.pages.dev
- **Staging**: https://boing-finance.pages.dev

