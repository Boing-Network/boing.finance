# Environment Variables & Configuration

## Required (Production)

- `REACT_APP_ENVIRONMENT=production`
- `REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev`

Set these in Cloudflare Pages → Project → Settings → Environment Variables (or in `frontend/.env.local` for local dev).

---

## Optional API Keys

Copy `frontend/.env.example` to `frontend/.env.local` and fill in values. **Do not commit `.env.local`.**

### News APIs (Analytics crypto news feed)

- **NewsAPI.org** – [newsapi.org](https://newsapi.org/) (free tier: 100 req/day)  
  - `REACT_APP_NEWSAPI_KEY=`  
  - Used for the “Crypto & DeFi News” block on the Analytics Overview.
- **NewsAPI.ai** – [newsapi.ai](https://newsapi.ai/) (optional; for future sentiment/richer news)  
  - `REACT_APP_NEWSAPI_AI_KEY=`

### Other optional

- **CoinGecko** – `REACT_APP_COINGECKO_API_KEY` (higher rate limits, NFT markets)
- **Etherscan** – `REACT_APP_ETHERSCAN_API_KEY`
- **The Graph, Alchemy, LiFi, Socket** – see `frontend/.env.example`

---

## IPFS / RPC

- IPFS keys (Pinata, Storacha, etc.) – optional; R2 is primary storage.
- RPC URLs – optional; defaults exist in code.

---

## Security

All `REACT_APP_`* variables are **public** (in the frontend bundle). Use only keys that are safe to expose. For secrets, use backend env (e.g. `wrangler secret put`).

---

## Verification

1. Visit [https://boing.finance](https://boing.finance)
2. DevTools → Console: check for API errors
3. Test features that depend on the backend or optional APIs

Related: `frontend/.env.example` lists all supported variables.