# Deployment Guide

Complete guide for deploying boing.finance to Cloudflare Workers and Pages.

## 🚀 Quick Start

### Automated Deployment (Recommended)

Deployments are **automatically triggered** when you push to GitHub:

- **Push to `main`** → Deploys to **production**
- **Push to `staging`** → Deploys to **staging**

**Requirements:**
- GitHub Secrets configured (see Setup section)
- Projects auto-created on first deployment

### Manual Deployment

```bash
# Backend
./deploy-backend.sh staging   # or production

# Frontend  
./deploy-frontend.sh staging  # or production
```

## 📋 Setup

### 1. GitHub Secrets

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

- **`CLOUDFLARE_API_TOKEN`** - Get from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
  - Permissions: Cloudflare Workers:Edit, Cloudflare Pages:Edit
  - Scope: Account
- **`CLOUDFLARE_ACCOUNT_ID`** - Found in Cloudflare Dashboard sidebar

### 2. Cloudflare Pages Projects

Projects are **auto-created** on first deployment:
- `boing-finance-prod` (production)
- `boing-finance` (staging)

If auto-creation fails, create manually:
```bash
wrangler pages project create boing-finance-prod
wrangler pages project create boing-finance
```

## 🌐 URLs

### Production
- **Frontend**: https://boing-finance-prod.pages.dev
- **Backend**: https://boing-api-prod.nico-chikuji.workers.dev

### Staging
- **Frontend**: https://boing-finance.pages.dev
- **Backend**: https://boing-api-staging.nico-chikuji.workers.dev

## 📁 Project Structure

### Expected Cloudflare Resources

**Workers:**
- `boing-api-prod` (production)
- `boing-api-staging` (staging)

**Pages:**
- `boing-finance-prod` (production)
- `boing-finance` (staging)

**R2 Buckets:**
- `boing-storage` (production)
- `boing-storage-preview` (staging)

### 3. D1 Database Migrations

After deploying, run the portfolio snapshots migration for PnL tracking:

```bash
cd backend
wrangler d1 execute boing-database --remote --file=./d1-portfolio-snapshots.sql
```

For production, use the production database name from wrangler.toml.

### 4. KV Caching (Optional)

KV caching is now enabled. If you need to recreate it:

```bash
cd backend
npx wrangler kv namespace create BOING_CACHE
npx wrangler kv namespace create BOING_CACHE --preview
```

Add the returned IDs to `wrangler.toml` under `[[kv_namespaces]]`, then redeploy.

## 🧹 Cleanup

### Remove Unused Projects

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/workers/pages)
2. Review all Pages projects
3. Delete any projects NOT listed above
4. See `CLOUDFLARE_CLEANUP_GUIDE.md` for details

## ⚡ Performance

- **Response compression**: Cloudflare Workers automatically compress responses (gzip/Brotli) when clients send `Accept-Encoding`. No extra backend configuration is required.

### Backend secrets (optional)

For **contract verification** (Security Scanner), the API can use block-explorer API keys to avoid rate limits. Set via `wrangler secret put` per environment:

- `ETHERSCAN_API_KEY` – Ethereum, Sepolia, Optimistic Etherscan
- `BSCSCAN_API_KEY` – BNB Smart Chain (mainnet + testnet)
- `POLYGONSCAN_API_KEY` – Polygon (mainnet + testnet)
- `ARBISCAN_API_KEY` – Arbitrum
- `BASESCAN_API_KEY` – Base

If not set, verification still works with public rate limits.

## 🔧 Troubleshooting

### Deployment Fails
- Check GitHub Actions logs
- Verify API token permissions
- Ensure projects exist (or auto-create is enabled)

### Site Doesn't Load
- Wait 1-2 minutes for propagation
- Check project status in Cloudflare Dashboard
- Verify deployment succeeded in GitHub Actions

## 📚 Related Documentation

- `.github/workflows/` - GitHub Actions workflows
- `deploy-backend.sh` / `deploy-frontend.sh` - Manual deployment scripts
- `CLOUDFLARE_CLEANUP_GUIDE.md` - Detailed cleanup instructions

