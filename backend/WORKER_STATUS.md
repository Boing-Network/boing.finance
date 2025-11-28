# Cloudflare Workers Status

## Current Workers

### ✅ Active Workers

1. **`boing-api-prod`** - Production Worker
   - URL: https://boing-api-prod.nico-chikuji.workers.dev
   - Status: Active
   - Deployed via: `npm run deploy:prod` or `wrangler deploy --env production`

### ✅ Staging Worker

2. **`boing-api-staging`** - Staging Worker
   - URL: https://boing-api-staging.nico-chikuji.workers.dev
   - Status: **Active** (deployed on 2025-11-28)
   - R2 Bucket: `boing-storage-preview` (created on 2025-11-28)
   - Deployed via: `npm run deploy:staging` or `wrangler deploy --env staging`

## Deleted Workers

### 🗑️ Removed Workers

- **`boing-api`** - Deleted on 2025-11-28
  - This was the unused base worker
  - Safe to delete as it was only for local development
  - All code references have been updated

## Summary

- **Total Active Workers**: 2
  - `boing-api-prod` (Production)
  - `boing-api-staging` (Staging)
- **R2 Buckets**: 2
  - `boing-storage` (Production)
  - `boing-storage-preview` (Staging - created 2025-11-28)
- **Unused Workers**: 0 (all cleaned up)

## Next Steps

If you want to deploy the staging environment:

```bash
cd dex/backend
npm run deploy:staging
```

This will create the `boing-api-staging` worker automatically.

