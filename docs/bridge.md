# Bridge

**Today:** the [Bridge](https://boing.finance/bridge) page routes transfers between other chains through **LI.FI** (below). Boing L1 (6913) is not a LI.FI network, so you cannot bridge to or from Boing yet.

**Planned:** a native **Boing ↔ Base** bridge, signed by Boing validators with a 2/3 threshold. See [Native Boing ↔ Base bridge (planned)](#native-boing--base-bridge-planned).

## LI.FI (other chains, live)

> 👋 **Everyday users:** [Bridge](https://boing.finance/bridge) moves tokens between every **LI.FI** network (EVM, Solana, Bitcoin, Sui, Tron). Boing does **not** hold bridge inventory.  
> 🛠️ **Developers:** chains/tokens/status come straight from `https://li.quest/v1`; quotes go through `GET /api/aggregator/lifi/quote`.  
> 🛰️ **Operators:** register integrator `boing.finance` on [LI.FI Partner Portal](https://portal.li.fi/) and set the fee wallet.

*Last reviewed: November 2026.*

## What shipped

- **Chains:** `GET /v1/chains?chainTypes=EVM,SVM,UTXO,MVM,TVM` (every mainnet LI.FI chain, about 70), cached 6 h in memory + localStorage. Both selectors list them all; on the sending side chains without an app wallet (Bitcoin, Sui, Tron, Zcash) say *Receive only*.
- **Tokens:** `GET /v1/tokens?chains=<id>` per chain (thousands on large chains), cached 6 h (compact form, last 4 chains in localStorage). Search by symbol, name or address; when the list has no exact match the modal asks `GET /v1/token` (finds tokens outside the default list, e.g. BONK on Solana). The list is windowed (`components/bridge/VirtualList.jsx`), logos come from LI.FI.
- **Select Token tabs:** *My Tokens* = balances (EVM: `GET /v1/wallets/{address}/balances`; Solana: RPC `getParsedTokenAccountsByOwner`), *Popular* = full LI.FI list (gas token and major coins first), *Custom* = imported tokens, *Import* = paste an address, validated with `GET /v1/token`. Footer shows the selected network.
- **Quotes:** `GET /v1/quote` (one ready-to-sign step) with slippage (0.1 / 0.5 / 1 / 3 %), `toAddress` for other chain types. Preview quotes before a wallet is connected use throwaway addresses; execution always re-quotes with the real sender and recipient.
- **Execution:** EVM: switch / add the network (from LI.FI `metamask` data) → exact-amount ERC-20 approval only if the allowance is short (USDT on Ethereum is reset to 0 first) → send `transactionRequest`. Solana: sign the LI.FI versioned transaction (Phantom `signAndSendTransaction`, else sign + send via RPC).
- **Status:** `GET /v1/status` every 12 s until `DONE` / `FAILED` (partial and refunded explained); recent transfers persist in localStorage. Errors are mapped to plain sentences (`utils/lifiCore.js` `explainLifiError`).
- **0.5%** platform fee on cross-chain quotes (`fee=0.005`, integrator `boing.finance`).
- Deep link to Jumper/LI.FI under *Route details*.
- **No** native `CrossChainBridge` deploy, relayer, or destination inventory. No LI.FI SDK (plain REST keeps the bundle small).

Boing L1 (6913) is not a LI.FI network.

## LI.FI limits

| Endpoint | Without API key | With the Worker's key |
|----------|-----------------|------------------------|
| `/quote`, `/advanced/routes` | 75 requests / 2 h per IP | 100 req/min (12,000 / 2 h) shared across users |
| `/chains`, `/tokens`, `/token`, `/status`, `/wallets` | 100 requests / min per IP | — (called from the browser) |

So quotes go through the Worker (key server-side, never in the browser) and fall back to direct LI.FI only if the Worker is down. Wallet balances (`/wallets/…/balances`) cover EVM addresses only.

## Fees

| Fee | Who | How |
|-----|-----|-----|
| 0.5% platform | Boing | LI.FI integrator `fee` on cross-chain quotes |
| Gas | User | Source-chain tx |
| Route / bridge / DEX | Third party | Included in the LI.FI quote |

LI.FI takes the integrator cut from the **sending** token and pays the wallet configured for this integrator in the Partner Portal (FeeForwarder on supported chains). Passing `fee` without portal registration may still quote, but **payouts will not land in Nico’s wallet**.

The Swap page trades only on Boing native pools and does not use LI.FI.

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

- `GET /api/aggregator/lifi/quote?fromChain=&toChain=&fromToken=&toToken=&fromAmount=&fromAddress=[&toAddress=&slippage=&order=]` — any LI.FI chain id or key; returns `{ success: true, data: <LI.FI step> }` or `{ success: false, lifi: true, status, error: <LI.FI error body> }`
- `GET /api/aggregator/bridge-config` — fee bps, recipient if configured
- `GET /api/bridge/status` — aggregator mode, not a proprietary uptime probe

## Native Boing ↔ Base bridge (planned)

Not built yet. The outline:

- **Base first.** Other EVM chains come later, if at all.
- **Validator attestation.** Every Boing validator signs bridge events; a transfer is final once validators holding at least **2/3** of the stake have signed. No separate relayer set or multisig.
- **Boing side:** a native Rust module in the protocol, switched on at a set testnet block height. It locks or burns on Boing and releases or mints when a valid attestation arrives from Base.
- **Base side:** a `BoingBridgeVault` contract, first on **Base Sepolia**, that checks the validator signatures before releasing funds.
- The app will show the native route next to LI.FI on `/bridge`. LI.FI stays for other chains.

The old Sepolia `CrossChainBridge.sol` and the `contracts/` folder have been removed from this repo.
