# Boing Finance

**Boing Finance** is the DEX for **Boing Network L1** (chain 6913): swap, pools, liquidity and portfolio on native Boing pools, signed with [Boing Express](https://boing.express). A **Bridge** page moves tokens between other chains through LI.FI; a native Boing ↔ Base bridge is planned ([docs/bridge.md](./docs/bridge.md)).

> **Status:** Boing runs on the public testnet; Boing mainnet is not live. Nothing here is financial advice or a guarantee of safety or returns.

> 👋 **Everyday users:** open [boing.finance](https://boing.finance), connect Boing Express, then swap or add liquidity. Boing accounts are 32 bytes.  
> 🛠️ **Developers:** Vite + React frontend, Cloudflare Workers + D1 backend. Trading goes through `@boing-network/boing-sdk` + Express.  
> 🛰️ **Operators:** canonical env is `frontend/.env.example`. Smoke: `cd frontend && npm run smoke:boing-rpc`.

```mermaid
flowchart TB
  App[boing.finance]
  App --> Boing[Boing L1 6913 · swap, pools, liquidity, portfolio]
  Boing --> Express[Boing Express]
  Boing --> RPC[testnet-rpc.boing.network]
  App --> Bridge[Bridge · LI.FI, other chains]
```

Frontend is **Vite + React 18**. Backend is **Cloudflare Workers + D1**.

## Architecture

```
├── frontend/          # Vite React app (build output: dist/)
├── backend/           # Cloudflare Workers API (Hono)
└── docs/              # Start at docs/README.md
```

### Boing Network L1 (chain 6913)

Boing L1 runs the **Boing VM**, not EVM bytecode. This repo has no Solidity.

Native swap, pool discovery, and operator handoffs: **[docs/native-dex.md](./docs/native-dex.md)** and **[docs/native-dex-discovery.md](./docs/native-dex-discovery.md)**. Upstream: [HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md).

Hosted Fly testnet currently publishes **`end_user.canonical_native_*`** (verified 2026-11-01). Still prefer the live RPC snapshot over embedded SDK hexes after a rotation.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Query, `@boing-network/boing-sdk` (ethers and `@solana/web3.js` are loaded only on the Bridge page)
- **Backend:** Cloudflare Workers, Hono, D1, Drizzle ORM

## Quick start

Prerequisites: Node.js 20+ (22 recommended; CI uses 22), npm, Git, and a clone of [Boing-Network/boing.network](https://github.com/Boing-Network/boing.network) (the frontend links its `boing-sdk` package from it).

```bash
git clone https://github.com/Boing-Network/boing.finance.git
cd boing.finance

# The frontend depends on file:../boing.network/boing-sdk (relative to frontend/),
# so the SDK repo must be at ./boing.network inside this repo (it is gitignored; CI does the same).
git clone https://github.com/Boing-Network/boing.network.git boing.network

# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal) — Vite on port 3000
cd frontend && npm install && npm start
# http://localhost:3000
```

From the repo root: `npm run dev` runs backend and frontend together.

**No `boing.network` clone?** `@boing-network/boing-sdk` is also published on npm (0.5.38 at the time of writing). In `frontend/package.json`, change `"@boing-network/boing-sdk": "file:../boing.network/boing-sdk"` to `"^0.5.38"` and run `npm install`. Don't commit that change (or the lockfile it rewrites) unless you mean to move the project off the linked checkout.

## Deployment

**GitHub Actions:** push to `main` → production; `staging` deploys the frontend preview only (the backend has a single production Worker, `boing-api-prod`). Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Details: [docs/deployment.md](./docs/deployment.md).

```bash
./deploy-backend.sh production   # only environment (no staging API Worker)
./deploy-frontend.sh staging
```

Cloudflare Pages (manual): root `frontend`, build `npm install && npm run build:prod`, output **`dist`**.

## Community

Join the [Boing Network Discord](https://discord.gg/K3w9nbUw4N) (Boing Finance also has its own [Discord](https://discord.gg/7RDtQtQvBW)).

## Documentation

See **[docs/README.md](./docs/README.md)** for the full index.

| Document | Description |
|----------|-------------|
| [docs/native-dex.md](./docs/native-dex.md) | Boing VM AMM, roadmap, indexer |
| [docs/native-dex-discovery.md](./docs/native-dex-discovery.md) | L1 list RPCs + operator handoff |
| [docs/deployment.md](./docs/deployment.md) | Cloudflare Workers/Pages |
| [docs/configuration.md](./docs/configuration.md) | Env vars |
| [docs/bridge.md](./docs/bridge.md) | LI.FI bridge (live) + planned native Boing ↔ Base bridge |
| [docs/boing-tokenomics.md](./docs/boing-tokenomics.md) | Where BOING (the Boing Network L1 token) economics are documented |
| [frontend/docs/DESIGN.md](./frontend/docs/DESIGN.md) | Visual system |

## Configuration

**Backend secrets** (Wrangler): RPC URLs, `JWT_SECRET`, optional `LIFI_API_KEY`, `HELIUS_API_KEY` (Solana RPC proxy for the Bridge wallet).  
**Public Worker vars:** `LIFI_INTEGRATOR_FEE` (default 0.5%), `LIFI_FEE_RECIPIENT` (same address as LI.FI Partner Portal).

**Frontend** (Cloudflare Pages or `frontend/.env.local`):

```bash
REACT_APP_ENV=production
REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev
```

All `REACT_APP_*` values are public in the bundle.

## API

Workers mount routes in `backend/src/worker.js` (`/api/aggregator` for LI.FI, `/api/solana/rpc`, `/api/portfolio`, `/analytics`, …). Health: `GET /`.
