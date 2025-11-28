# Cloudflare Workers Status

## Current Workers

### ✅ Active Workers

1. **`boing-api-prod`** - Production Worker
   - URL: https://boing-api-prod.nico-chikuji.workers.dev
   - Status: Active
   - Deployed via: `npm run deploy:prod` or `wrangler deploy --env production`

### 📝 Staging Worker

2. **`boing-api-staging`** - Staging Worker
   - URL: https://boing-api-staging.nico-chikuji.workers.dev
   - Status: **Not yet deployed** (this is expected)
   - Will be created when you run: `npm run deploy:staging` or `wrangler deploy --env staging`
   - Configuration is ready in `wrangler.toml`

## Deleted Workers

### 🗑️ Removed Workers

- **`boing-api`** - Deleted on 2025-11-28
  - This was the unused base worker
  - Safe to delete as it was only for local development
  - All code references have been updated

## Summary

- **Total Active Workers**: 1 (boing-api-prod)
- **Staging Worker**: Configured but not yet deployed (will be created on first staging deployment)
- **Unused Workers**: 0 (all cleaned up)

## Next Steps

If you want to deploy the staging environment:

```bash
cd dex/backend
npm run deploy:staging
```

This will create the `boing-api-staging` worker automatically.

