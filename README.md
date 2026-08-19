# boing.finance

Cross-chain DeFi app: **EVM** (TokenFactory, Sepolia DEX, LI.FI aggregator), **Solana** (SPL deploy, Jupiter), and **Boing Network L1** (native VM AMM via Boing Express).

Frontend is **Vite + React 18**. Backend is **Cloudflare Workers + D1**.

## Architecture

```
├── frontend/          # Vite React app (build output: dist/)
├── backend/           # Cloudflare Workers API (Hono)
├── contracts/         # Solidity (EVM only — not loadable on Boing VM)
└── docs/              # Engineering docs (start at docs/README.md)
```

### Boing Network L1 (chain 6913)

Boing L1 runs the **Boing VM**, not EVM application bytecode. Native swap, pool discovery, and operator handoffs: **[docs/native-dex.md](./docs/native-dex.md)** and **[docs/native-dex-discovery.md](./docs/native-dex-discovery.md)**. Upstream: [HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md), [THREE-CODEBASE-ALIGNMENT.md](https://github.com/Boing-Network/boing.network/blob/main/docs/THREE-CODEBASE-ALIGNMENT.md).

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, React Query, ethers.js, `@solana/web3.js`, `boing-sdk`
- **Backend:** Cloudflare Workers, Hono, D1, Drizzle ORM (Better-SQLite3 locally)
- **Contracts:** Solidity, Hardhat, OpenZeppelin

## Quick start

Prerequisites: Node.js 18+, npm, Git. Cloudflare account only if you deploy.

```bash
git clone <repository-url>
cd boing.finance

# Backend (Cloudflare Worker via Wrangler)
cd backend && npm install && npm run dev

# Frontend (separate terminal) — Vite listens on port 3000
cd frontend && npm install && npm start
# http://localhost:3000
```

From the repo root: `npm run dev` runs backend and frontend together.

### Smart contracts (optional)

```bash
cd contracts
npm install
npm run compile
npm run check:dex
# DEX deploy: npm run deploy:dex -- --network sepolia
```

## Deployment

**GitHub Actions:** push to `main` → production; `staging` → staging. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Details: [docs/deployment.md](./docs/deployment.md).

Manual:

```bash
./deploy-backend.sh staging    # or production
./deploy-frontend.sh staging   # builds frontend/dist, wrangler pages deploy
```

Cloudflare Pages (if configuring the dashboard by hand):

- Root: `frontend`
- Build command: `npm install && npm run build:prod` (or `build:staging`)
- Output directory: **`dist`** (not `build`)

## Documentation

See **[docs/README.md](./docs/README.md)** for the full index. Highlights:

| Document | Description |
|----------|-------------|
| [docs/native-dex.md](./docs/native-dex.md) | Boing L1 vs EVM DEX, roadmap, indexer |
| [docs/native-dex-discovery.md](./docs/native-dex-discovery.md) | L1 list RPCs + operator handoff |
| [docs/deployment.md](./docs/deployment.md) | Cloudflare Workers/Pages |
| [docs/configuration.md](./docs/configuration.md) | Env vars (canonical list: `frontend/.env.example`) |
| [docs/contracts.md](./docs/contracts.md) | EVM TokenFactory / DEX enablement |
| [docs/integration.md](./docs/integration.md) | Networks, Solana, swap market data |
| [frontend/docs/DESIGN.md](./frontend/docs/DESIGN.md) | Visual system (Colosseum shell) |

## Configuration

**Backend secrets** (Wrangler): RPC URLs, `JWT_SECRET`, optional `LIFI_API_KEY` / `JUPITER_API_KEY`.

**Frontend** (Cloudflare Pages or `frontend/.env.local`):

```bash
REACT_APP_ENV=production
REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev
```

`REACT_APP_ENVIRONMENT` is accepted as an alias (`frontend/vite.config.mjs`). All `REACT_APP_*` values are public in the bundle.

## API

Workers mount routes in `backend/src/worker.js` (`/api/dex`, `/api/aggregator`, `/api/governance`, `/api/solana`, …). Health: `GET /`.
