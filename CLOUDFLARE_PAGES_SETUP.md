# Cloudflare Pages Project Setup

## Issue: Projects Don't Exist

The GitHub Actions workflow is trying to deploy to Cloudflare Pages projects that don't exist yet:
- `boing-finance-prod` (for production)
- `boing-finance` (for staging)

## Solution: Create Projects First

You have two options:

### Option 1: Create Projects via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Create a project**
4. Choose **Upload assets** (we'll deploy via GitHub Actions)
5. Set project name:
   - For production: `boing-finance-prod`
   - For staging: `boing-finance`
6. Click **Create project**
7. The project will be created (you don't need to upload anything - GitHub Actions will handle deployments)

### Option 2: Create Projects via Wrangler CLI

Run these commands locally (requires `wrangler` installed and authenticated):

```bash
# Create production project
wrangler pages project create boing-finance-prod

# Create staging project
wrangler pages project create boing-finance
```

### Option 3: Let Wrangler Auto-Create (May Not Work)

The updated workflow uses `wrangler pages deploy` which *should* auto-create projects, but this depends on your API token permissions. If it fails, use Option 1 or 2 above.

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

