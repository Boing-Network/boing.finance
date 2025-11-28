# Cloudflare Pages Project Status

## Expected Projects

After setup, you should have exactly **2** Cloudflare Pages projects:

1. **`boing-finance-prod`** 
   - Environment: Production
   - Branch: `main`
   - URL: https://boing-finance-prod.pages.dev
   - Auto-created on first deployment to `main` branch

2. **`boing-finance`**
   - Environment: Staging
   - Branch: `staging`
   - URL: https://boing-finance.pages.dev
   - Auto-created on first deployment to `staging` branch

## Auto-Creation

The GitHub Actions workflow is configured to **automatically create** these projects when deploying:

- ✅ Projects are created automatically by `wrangler pages deploy`
- ✅ No manual setup required
- ✅ First deployment will create the project if it doesn't exist

## Cleanup Checklist

To keep your Cloudflare account clean, verify:

- [ ] Only 2 Pages projects exist (listed above)
- [ ] No old/unused projects remain
- [ ] All projects are actively used

## How to Check for Unused Projects

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Review all projects
4. Delete any projects that are NOT:
   - `boing-finance-prod`
   - `boing-finance`

See `CLOUDFLARE_CLEANUP_GUIDE.md` for detailed cleanup instructions.

## Verification

After cleanup, you should see:
- ✅ Exactly 2 Pages projects
- ✅ Both projects accessible via their URLs
- ✅ No unused/old projects

