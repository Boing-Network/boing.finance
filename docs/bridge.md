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

Live values stay **out of git**. Set them on Cloudflare (and optionally GitHub Actions so CI can sync):

1. Log in at [portal.li.fi](https://portal.li.fi/) and register integrator **`boing.finance`**.
2. Paste the EVM / Solana / Bitcoin fee wallets in the portal (LI.FI pays those wallets; Sol/BTC are direct payout, no inventory).
3. Worker secrets (`cd backend`):

```bash
printf '%s' "$LIFI_API_KEY" | wrangler secret put LIFI_API_KEY --env production
printf '%s' "$LIFI_FEE_RECIPIENT" | wrangler secret put LIFI_FEE_RECIPIENT --env production
printf '%s' "$LIFI_FEE_RECIPIENT_SOL" | wrangler secret put LIFI_FEE_RECIPIENT_SOL --env production
printf '%s' "$LIFI_FEE_RECIPIENT_BTC" | wrangler secret put LIFI_FEE_RECIPIENT_BTC --env production
```

4. Optional GitHub Actions secrets with the same names — `deploy-backend.yml` copies them to the Worker on production deploys.
5. Optional Pages overlay `REACT_APP_LIFI_FEE_RECIPIENT` (build-time). The Bridge UI also reads `/api/aggregator/bridge-config` at runtime.

**No bridge inventory.** Fee wallets only receive payouts.

## API

- `GET /api/aggregator/quote?chain=<fromChain>&toChain=<toChain>&fromToken=&toToken=&fromAmount=&fromAddress=`
- `GET /api/aggregator/bridge-config` — fee bps, recipient if configured
- `GET /api/bridge/status` — aggregator mode, not a proprietary uptime probe

## Native contract (not this MVP)

`contracts/contracts/CrossChainBridge.sol` remains Sepolia-only and unused by `/bridge`. Priority stays **Low** in [contracts.md](./contracts.md).
