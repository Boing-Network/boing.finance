# Environment variables & configuration

> 👋 **Everyday users:** skip this.  
> 🛠️ **Developers:** canonical list is **`frontend/.env.example`**. This page is the production checklist.  
> 🛰️ **Operators:** all `REACT_APP_*` values are public in the bundle — never put secrets there.

Canonical list of frontend variables: **`frontend/.env.example`**. This page is the production checklist, not a duplicate catalog.

*Last reviewed: August 2026.*

## Required (production)

Set in Cloudflare Pages → Project → Settings → Environment Variables (or `frontend/.env.local` for local dev):

- `REACT_APP_ENV=production` — primary flag (`development` | `staging` | `production`). CI `build:prod` / `build:staging` set this.
- `REACT_APP_ENVIRONMENT` — optional **alias**; `frontend/vite.config.mjs` copies it to/from `REACT_APP_ENV` if only one is set.
- `REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev`

## Optional API keys

Copy `frontend/.env.example` to `frontend/.env.local`. **Do not commit `.env.local`.**

- **News** — `REACT_APP_NEWSAPI_KEY`, optional `REACT_APP_NEWSAPI_AI_KEY` (Analytics news feed)
- **CoinGecko** — `REACT_APP_COINGECKO_API_KEY`
- **Etherscan** — `REACT_APP_ETHERSCAN_API_KEY`
- **The Graph, Alchemy, LiFi (browser)** — see `.env.example`
- **LI.FI / Jupiter (Worker)** — `wrangler secret put LIFI_API_KEY` / `JUPITER_API_KEY` on `boing-api-*`. Quotes work without keys.

Native DEX / Boing RPC flags are documented in [native-dex.md](./native-dex.md) and [native-dex-discovery.md](./native-dex-discovery.md); they are listed in `.env.example`.

## IPFS / RPC

- IPFS keys (Pinata, Storacha, etc.) — optional; R2 is primary storage.
- RPC URLs — optional; defaults live in `frontend/src/config/networks.js`.

## Security

All `REACT_APP_*` variables are **public** (frontend bundle). Use only keys that are safe to expose. Secrets belong on the Worker (`wrangler secret put`).

## Verification

1. Visit [https://boing.finance](https://boing.finance)
2. DevTools → Console: check for API errors
3. Exercise backend-dependent and optional-API features
