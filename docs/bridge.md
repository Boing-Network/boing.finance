# Bridge (LI.FI aggregator MVP)

> 👋 **Everyday users:** [Bridge](https://boing.finance/bridge) moves EVM tokens through **LI.FI**. Boing does **not** hold bridge inventory.  
> 🛠️ **Developers:** quotes are `GET /api/aggregator/quote` with `toChain` ≠ `chain`.  
> 🛰️ **Operators:** register integrator `boing.finance` on [LI.FI Partner Portal](https://portal.li.fi/) and set the fee wallet.

*Last reviewed: October 2026.*

## What shipped

- In-app EVM↔EVM quotes and execution via LI.FI (`transactionRequest` signed in the user’s wallet).
- **0.5%** platform fee (`fee=0.005`, integrator `boing.finance`).
- Deep link to Jumper/LI.FI if a route is missing.
- **No** native `CrossChainBridge` deploy, relayer, or destination inventory.

Boing L1 (6913) and Solana↔EVM are **not** this page.

## Fees

| Fee | Who | How |
|-----|-----|-----|
| 0.5% platform | Boing | LI.FI integrator `fee` on cross-chain quotes |
| Gas | User | Source-chain tx |
| Route / bridge / DEX | Third party | Included in the LI.FI quote |

LI.FI takes the integrator cut from the **sending** token and pays the wallet configured for this integrator in the Partner Portal (FeeForwarder on supported chains). Passing `fee` without portal registration may still quote, but **payouts will not land in Nico’s wallet**.

Same-chain Swap quotes are unchanged (no extra 0.5% there).

## What Nico must set

1. Create / log in at [portal.li.fi](https://portal.li.fi/).
2. Register integrator string **`boing.finance`** (already sent on every quote).
3. Set the **fee recipient** wallet to the platform address (can be the same as TokenFactory `PLATFORM_WALLET`).
4. Optional app config (public address, not a secret):
   - Frontend: `REACT_APP_LIFI_FEE_RECIPIENT=0x…` (Pages / `frontend/.env.local` / `frontend/env/github-build.*.env`)
   - Worker: `LIFI_FEE_RECIPIENT` in `backend/wrangler.toml` `[vars]` (or dashboard). Fallback: `PLATFORM_WALLET` if that var exists on the Worker.
5. Optional: `wrangler secret put LIFI_API_KEY` for higher LI.FI rate limits. Quotes work without it.
6. Optional override: Worker `LIFI_INTEGRATOR_FEE` (default `0.005`).

**No bridge inventory and no funded fee-wallet gas** is required for users to bridge. The fee wallet only *receives* tokens; it does not send unlock transactions.

Redeploy the API Worker after changing Worker vars; rebuild the frontend after changing `REACT_APP_*`.

## API

- `GET /api/aggregator/quote?chain=<fromChain>&toChain=<toChain>&fromToken=&toToken=&fromAmount=&fromAddress=`
- `GET /api/aggregator/bridge-config` — fee bps, recipient if configured
- `GET /api/bridge/status` — aggregator mode, not a proprietary uptime probe

## Native contract (not this MVP)

`contracts/contracts/CrossChainBridge.sol` remains Sepolia-only and unused by `/bridge`. Priority stays **Low** in [contracts.md](./contracts.md).
