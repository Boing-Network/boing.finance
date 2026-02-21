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

---

## Mainnet deployment (per network)

This section ensures each integrated blockchain network is **mainnet-ready** before deployment. For per-network cost estimates (full feature set: TokenFactory, DEX, Bridge, PriceOracle, NFT), see the **Deployment cost plan** below.

### Pre-deployment checklist (per network)

- [ ] **RPC configured** – Primary + fallback RPCs in `frontend/src/config/networks.js`
- [ ] **Wallet add params** – `getWalletAddChainParams()` returns valid chainId, chainName, nativeCurrency, rpcUrls, blockExplorerUrls
- [ ] **WETH/Wrapped native** – Correct address in `frontend/src/config/contracts.js`
- [ ] **SERVICE_CHARGES** – Mainnet pricing in `frontend/src/pages/DeployToken.js`
- [ ] **External links** – Swap/Bridge URLs in `frontend/src/config/networkExternalLinks.js` (fallback when DEX not deployed)
- [ ] **Hardhat network** – Entry in `contracts/hardhat.config.js` and `contracts/config/networks.js`
- [ ] **Environment variables** – Optional RPC overrides documented in `frontend/.env.example`

### Deployment order (by user activity)

See [docs/integration.md](integration.md) for prioritization.

1. Ethereum, BSC, Base, Arbitrum, Polygon, Optimism (TokenFactory already deployed)
2. Avalanche, zkSync Era, Mantle, Scroll, Linea, Blast, Fantom, opBNB, Mode (deploy when funded)

### Deploy TokenFactory (per network)

```bash
cd contracts
export DEPLOYER_PRIVATE_KEY=your_private_key
npx hardhat run scripts/deploy-token-factory.js --network avalanche
# Or: node scripts/deploy-token-factory-multi-network.js
```

After deployment: update `frontend/src/config/contracts.js`, verify on block explorer, remove placeholder `0x0000...` entries.

### Security checklist

- [ ] No private keys in frontend or version control
- [ ] Input validation on Deploy Token (name, symbol, decimals, supply limits)
- [ ] Contract verification on block explorer
- [ ] Standards compliance (ERC-20, ERC-721)

### Network-specific notes (WETH / wrapped)

| Network   | WETH/Wrapped   | Notes |
|-----------|----------------|-------|
| BSC       | WBNB           | 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c |
| Polygon   | WMATIC         | 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270 |
| Avalanche | WAVAX          | 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7 |
| Fantom    | WFTM           | 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83 |
| zkSync    | WETH           | 0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91 |
| opBNB / Mode | WBNB / WETH | 0x4200000000000000000000000000000000000006 (OP Stack) |

---

## Deployment cost plan

**Objective:** Deploy all features on all widely-used EVM networks. Costs are estimates; gas and native token prices vary.

### Feature-to-contract mapping

| Feature | Required Contracts | Gas (approx) |
|---------|--------------------|--------------|
| Deploy Token | TokenFactory, TokenImplementation | ~2–3M gas |
| Create NFT | ERC-721 factory or direct mint | ~1–2M gas |
| Swap | DEXRouter, DEXFactory, WETH | ~3–4M gas |
| Pools / Liquidity / Create Pool | DEXFactoryV2, DEXRouter, LiquidityLocker | ~4–5M gas |
| Bridge | CrossChainBridge | ~2–3M gas |
| Price Feeds | PriceOracle (+ Chainlink) | ~1–2M gas |

**Total gas per full suite:** ~12–18M gas

### Per-network cost estimates (USD, full suite)

| Network | Chain ID | Low | Mid | High |
|---------|----------|-----|-----|------|
| Ethereum | 1 | $150 | $400 | $900+ |
| BSC | 56 | $2 | $8 | $25 |
| Base | 8453 | $0.50 | $2 | $6 |
| Arbitrum | 42161 | $1 | $4 | $15 |
| Polygon | 137 | $0.20 | $0.80 | $3 |
| Optimism | 10 | $1.50 | $5 | $20 |
| Avalanche | 43114 | $1 | $4 | $15 |
| zkSync Era | 324 | $0.50 | $2 | $8 |
| Linea | 59144 | $0.50 | $2 | $8 |
| Fantom | 250 | $0.10 | $0.50 | $2 |
| opBNB | 204 | $0.10 | $0.40 | $1.50 |
| Mode | 34443 | $0.10 | $0.50 | $2 |

**Grand total (all networks, mid):** ~$430; with contingency (+20–30%): ~$520–1,300.

### Cost-saving tips

- Batch deployments; deploy during low-traffic hours; use gas oracles before sending.
- Ethereum: wait for gas < 20 gwei to save 50%+ vs peak.
- Skip PriceOracle on chains without Chainlink; use external APIs as fallback.
- NFT: use direct mint (no factory) to save ~1.5M gas per network.

**References:** [L2 Fees](https://l2fees.info), [Etherscan Gas Tracker](https://etherscan.io/gastracker)
