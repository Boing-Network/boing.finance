# Deployment & Production Configuration

Complete guide for deploying boing.finance to Cloudflare Workers and Pages, and production checklist.

---

## Quick Start

### Automated Deployment (Recommended)

- **Push to `main`** → Deploys to **production**
- **Push to `staging`** → Deploys to **staging**

**Requirements:** GitHub Secrets configured (see Setup). Projects auto-created on first deployment.

### Manual Deployment

```bash
./deploy-backend.sh staging   # or production
./deploy-frontend.sh staging  # or production
```

---

## Setup

### 1. GitHub Secrets

GitHub → Settings → Secrets and variables → Actions:

- **`CLOUDFLARE_API_TOKEN`** – [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) (Workers:Edit, Pages:Edit)
- **`CLOUDFLARE_ACCOUNT_ID`** – Cloudflare Dashboard sidebar

### 2. Cloudflare Resources

**Pages (auto-created):** `boing-finance-prod`, `boing-finance` (staging)  
**Workers:** `boing-api-prod`, `boing-api-staging`  
**R2:** `boing-storage`, `boing-storage-preview`

### 3. URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | https://boing.finance | https://boing-api-prod.nico-chikuji.workers.dev |
| Staging | https://boing-finance.pages.dev | https://boing-api-staging.nico-chikuji.workers.dev |

---

## Production Configuration

### Custom Domains (Completed)

- `boing.finance` and `www.boing.finance` → `boing-finance-prod`

### Environment Variables (Cloudflare Pages Dashboard)

**Required:**
```
REACT_APP_ENVIRONMENT=production
REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev
```

**Optional:** Set in Pages → `boing-finance-prod` → Settings → Environment Variables. See [docs/configuration.md](configuration.md).

### Security & Build

- `_headers` and `_redirects` in `frontend/public/` (security headers, www→apex redirect)
- Build output: `build`; production branch: `main`
- SSL/TLS and DNS via Cloudflare

### Verification

```bash
curl -I https://boing.finance
# Test SPA: https://boing.finance/swap
```

---

## Backend

### D1 Migrations

```bash
cd backend
wrangler d1 execute boing-database --remote --file=./d1-portfolio-snapshots.sql
```

### Optional: Block Explorer API Keys (contract verification)

Set via `wrangler secret put` per environment: `ETHERSCAN_API_KEY`, `BSCSCAN_API_KEY`, `POLYGONSCAN_API_KEY`, `ARBISCAN_API_KEY`, `BASESCAN_API_KEY`.

### KV Caching

```bash
npx wrangler kv namespace create BOING_CACHE
npx wrangler kv namespace create BOING_CACHE --preview
```
Add returned IDs to `wrangler.toml` under `[[kv_namespaces]]`.

---

## Troubleshooting

- **Deployment fails:** Check GitHub Actions logs; verify token permissions.
- **Site doesn’t load:** Wait 1–2 min; check Cloudflare Dashboard and Actions status.

**Related:** `.github/workflows/`, `deploy-backend.sh`, `deploy-frontend.sh`
