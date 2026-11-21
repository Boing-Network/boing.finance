# Bridge

**Today:** the [Bridge](https://boing.finance/bridge) page has two modes — **Other chains (LI.FI)** (live) and **Boing ↔ Base** (native path, testnet code shipped, not activated until operators deploy). Boing L1 (6913) is not a LI.FI network.

**Native path:** inventory-free Boing ↔ Base with validator ⌈2W/3⌉ stake attestation and a **0.5%** fee. See [Native Boing ↔ Base bridge](#native-boing--base-bridge-testnet-code-shipped).

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

## Native Boing ↔ Base bridge (testnet code shipped)

**Not live on public testnet until operators deploy + activate.** Inventory-free lock/mint · **0.5%** fee · Base-first · validator **⌈2W/3⌉** stake.

| Piece | Location | Status |
|-------|----------|--------|
| Base Sepolia vault + bBOING | `contracts/bridge/` (Foundry) | Code + tests; **deploy keys = Nico** |
| Deploy script | `scripts/bridge/deploy-base-sepolia.sh` | Manual |
| Attestor dry-run | `scripts/bridge/attest-relayer.mjs` | Prints checklist; live submit needs keys |
| Boing protocol txs | `boing.network` `BridgeLockToBase` (41) / `BridgeClaimFromBase` (42) | Activation-gated (`BOING_BRIDGE_ACTIVATION_HEIGHT` unset = off) |
| Finance UI | `/bridge` → **Boing ↔ Base** tab | Distinct from LI.FI; execution gated on env addresses |

### Flows

1. **Boing → Base:** user locks native BOING on Boing → attestors ECDSA-sign → `BoingBridgeVault.mintWithAttestation` mints **bBOING** (fee on both sides = 50 bps).
2. **Base → Boing:** user `burnToBoing` → attestors Ed25519-sign → `BridgeClaimFromBase` unlocks escrow.

No Boing-held market inventory. Escrow only holds user-locked BOING that backs bBOING.

### What Nico must run

1. `cd contracts/bridge && forge test` (CI-friendly).
2. Fund a Base Sepolia key → `scripts/bridge/deploy-base-sepolia.sh` with `PRIVATE_KEY`, `FEE_RECIPIENT`, `BASE_SEPOLIA_RPC`.
3. `replaceValidatorSet` on the vault with secp256k1 attestor addresses + stake weights.
4. Set Pages env `REACT_APP_BOING_BASE_BRIDGE_VAULT` / `REACT_APP_BRIDGED_BOING_TOKEN`.
5. Coordinate `BOING_BRIDGE_ACTIVATION_HEIGHT` on **all** Boing testnet nodes + restart.
6. Run attestor with `ATTESTOR_ECDSA_KEYS` + `ATTESTOR_ED25519_SECRETS`.

See also: network `docs/BOING-BASE-BRIDGE.md` and the project pack `docs/boing-base-bridge-implementation.md`.
