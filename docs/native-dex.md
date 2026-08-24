# Native DEX on Boing L1

How **boing.finance** treats **Boing Network L1** (chain id **6913**, Boing VM) versus **EVM** chains, what is shipped, and what still belongs to the network team.

**Discovery RPCs, operator handoff, and client wiring:** [native-dex-discovery.md](./native-dex-discovery.md).  
**Canonical env catalog:** `frontend/.env.example`.  
**Live EVM addresses:** `frontend/src/config/contracts.js` (see [contracts.md](./contracts.md)).

*Last reviewed: August 2026.*

---

## 1. What runs where

There is **no compiler switch** that turns the Solidity tree in `contracts/` into Boing VM bytecode. Boing L1 does **not** run EVM opcodes for application contracts.

| Stack | Technology | Used on Boing L1 today? |
|--------|------------|-------------------------|
| **DEXFactoryV2, DEXRouter, LiquidityLocker, DEXPair** in `contracts/` | Solidity → EVM bytecode | **No.** Targets Ethereum-style VMs (Hardhat, Sepolia). |
| **Native constant-product AMM** | Built-in Boing execution + `ContractCall` calldata | **Yes** — swap / add liquidity in-app when a pool id is published (`REACT_APP_BOING_NATIVE_AMM_POOL` or live `end_user.canonical_native_cp_pool`). Hosted Fly testnet currently has none. |
| **Factory / many pairs / router / locker on L1** | Boing VM programs (new bytecode), not `.sol` artifacts | **Partial.** Module ids come from live RPC `end_user` hints or env; do not bake historical SDK hexes. Full Uniswap-class factory UX still depends on protocol + a published factory. |

### What the app does today

- **EVM networks:** `ethers`, ABIs under `frontend/src/artifacts/`, addresses from `frontend/src/config/contracts.js`.
- **Boing L1 (6913):** Boing RPC + Boing Express signing. `contracts.js` defines:
  - `nativeConstantProductPool` — 32-byte pool `AccountId` from `REACT_APP_BOING_NATIVE_AMM_POOL` when set; otherwise `0x00…00` until the hosted chain publishes `end_user.canonical_native_cp_pool`.
  - `nativeVm.dexFactory`, `swapRouter`, `ledgerRouterV2` / `V3`, `liquidityLocker`, plus LP vault / share token ids (env or live RPC; zeros when unpublished).
  - Runtime defaults come from **`fetchNativeDexIntegrationDefaults`** (`boing-sdk`): live `boing_getNetworkInfo.end_user` plus env overrides. Historical SDK-embedded 6913 hexes are **not** treated as live.

The **Swap** tab on 6913 targets the **network default** constant-product pool. Additional factory pairs (including multihop) are surfaced under **Pools** and **Smart route**.

### “Deploy the Solidity DEX on Boing” actually means

1. **On-chain programs** written for the Boing VM (instruction set, storage, logs, gas).
2. **QA / deploy policy** — bytecode passes `boing_qaCheck`, then **ContractDeploy** (optional Create2).
3. **Published ids** — 32-byte `AccountId` hex for factory, router, locker (and per-pair accounts if the design mirrors Uniswap pairs).
4. **App wiring** — `boing_simulateTransaction` / `boing_submitTransaction` with Boing calldata (`boing-sdk`), not `eth_call` / MetaMask for those flows.

Solidity in this repo remains a **reference design** and **EVM deployment source**.

---

## 2. Transparency (four layers)

End-to-end “contracts visible on **boing.observer** with clear behavior” spans:

| Layer | Role |
|-------|------|
| **Boing VM + RPC** | Execution, storage, events. Methods such as `boing_getTransactionReceipt`, `boing_getContractStorage`, `boing_getLogs`. |
| **boing.observer** | Accounts and transactions (richer contract pages as Observer ships them). |
| **“Etherscan-verified” clarity** | Published artifacts / interfaces (upstream) and/or a verifier product — **not** something the frontend alone can replace. |
| **boing.finance** | Deploy/swap UX, Observer links, `tx_id` from the signed payload, **View contract** when receipts include a log `address`. |

Account URLs: `https://boing.observer/account/{accountHex}` via `frontend/src/config/boingExplorerUrls.js`. Override with `REACT_APP_BOING_EXPLORER_BASE_URL`, else prefer RPC `boing_getNetworkInfo` → `end_user.explorer_url` (HTTPS), else `https://boing.observer`.

| Concept | EVM (e.g. Sepolia) | Boing L1 (6913) |
|--------|---------------------|------------------|
| Deploy unit | `solc` bytecode | **Boing VM bytecode** (templates in **boing-sdk** / env overrides) |
| Address | 20-byte `0x…` | **32-byte `AccountId`** (`0x` + 64 hex) |
| How dApps deploy | `ethers.ContractFactory` / MetaMask | **Boing Express** + `contract_deploy_meta` (+ QA) |
| Solidity in `contracts/` | Deployed here | **Reference / EVM only** |

---

## 3. Roadmap

Cross-repo: Boing VM programs must exist before this app can offer full factory/router/locker parity on L1. Protocol checklist: [BOING-L1-DEX-ENGINEERING.md](https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-L1-DEX-ENGINEERING.md).

### Phase 0 — shipped

- [x] Native constant-product pool + **NativeAmmSwapPanel** (swap / add liquidity via Boing Express).
- [x] `nativeVm.*` + env wiring in `contracts.js`; live RPC / env only (no historical SDK hex as live).
- [x] EVM path unchanged: Sepolia / mainnets use **DEXFactoryV2** via ethers.

### Phase P0 — reliability (shipped in this repo)

- [x] Richer deploy errors (`boingExpressRpcError.js`) for invalid opcode / template mismatch.
- [x] Observer URLs in `boingExplorerUrls.js` including `/tx/{tx_id}`.
- [x] Post-deploy deep link: `tx_id` from signed tx, background-poll `boing_getTransactionReceipt`, parse `logs[].address` — `boingExpressNativeTx.js`, `boingDeployReceiptFollowup.js`, `boingDeploySuccessToast.jsx`.
- [x] CI smoke: from `frontend/`, `npm run smoke:boing-rpc` (`boing_chainHeight`; optional `BOING_SMOKE_BYTECODE_HEX` for `boing_qaCheck`). Env: `BOING_SMOKE_RPC_URL`.
- [ ] **Verifier / artifact registry UI** — upstream (network + Observer).

### Phase 1 — network & bytecode (blocking; protocol owners)

- [ ] Calldata & storage spec for factory / router / locker aligned with Boing VM.
- [ ] Reference implementations as Boing VM bytecode.
- [ ] QA registry + testnet deploy + published AccountIds (beyond current canon).
- [ ] Indexer / RPC expectations (log topics, receipt layout) if Observer or the app list pairs from chain events.

### Phase 2 — app integration (in progress)

Much of the original “wait for non-zero ids” gate is **done on testnet** via SDK embeds + `BoingNativeDexIntegrationContext`. Remaining:

- [ ] Broader read paths if the network adds subgraph-class indexes.
- [ ] Additional `ContractCall` builders as new VM modules ship.
- [ ] `REACT_APP_BOING_NATIVE_VM_DEX_UI=1` when factory/router UI is fully productized (hides the amber “modules configured, UI in progress” banner).
- [ ] Transparency UX when RPC adds stable deployed-account fields (`pickDeployedAccountIdFromBoingReceipt`).

Feature detection: `getFeatureSupport().nativeVmDex` in `frontend/src/config/featureSupport.js`.

### Phase 3 — hardening

- [ ] Error mapping (QA reject, rate limits) consistent with existing `boingExpress` helpers.
- [ ] Broader E2E smoke against public testnet RPC.

### Upstream handoff status (this repo)

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Canonical pool / factory ids vs ops docs and `boing_getNetworkInfo` | **Hosted Fly ledger (2026-08-24):** `end_user` is null — do not bake historical `0x7247ddc3…`. Re-set `frontend/env/github-build.*.env` after ops bootstraps DEX. |
| **P1** | `fetchNativeDexIntegrationDefaults` / merge | **Wired** — context + `buildNativeDexOverridesFromEnv()`. |
| **P1** | `nativeDexRouting` | **Wired** — `hydrateCpPoolVenuesFromRpc` + `findBestCpRoute`; optional register-log merge when `REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK` is set. |
| **P2** | `providerSupportsBoingNativeRpc` | **Wired** — `WalletContext` blocks connect on 6913 when the injected provider fails the SDK check (steer to Boing Express). |

---

## 4. Uniswap-style capability (shipped vs next)

| Capability | Status |
|------------|--------|
| **Pool discovery** | Venues + factory pair count + search + pagination + `register_pair` log count (when from-block env is set). Optional D1 directory (`GET /v1/directory/pools`) merged by `poolHex` when `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL` is set. **Next:** chain-native event index if product requires it. |
| **Token picker** | Curated + directory + user-saved + recent + optional token-list JSON; indexer `tokenDirectory` merged via context. **Next:** richer on-chain metadata without indexer. |
| **Charts / TVL / volume** | Reserve bars + localStorage time-series + optional indexer history; first-party indexer CLI / Pages function; optional CoinGecko oracle. **Still upstream at scale:** long-range USD TVL. |
| **Multihop** | Smart route + Pools prefill + URL deep links (`nativeTradeTab`, `nativeTokenIn`/`Out`, `nativePool`). Unsigned simulate when `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall`. |
| **LP positions** | Per-pool total LP; share-token balances; vault↔pool map JSON. **Next:** LP NFT semantics. |
| **Mobile polish** | Scrollable tabs, 44px targets. **Next:** wallet deep links. |

### Native trade hub

`#boing-native-trade` on `/swap` — tabs **Swap | Pools | Smart route | Your liquidity** (`NativeBoingTradeHub`). Query params: `nativeTradeTab`, `nativeTokenIn` / `nativeTokenOut`, `nativePool`.

Key modules: `BoingNativeDexIntegrationContext`, `nativeDexIndexerDirectoryMerge.js`, `boingNativeLpShareBalance.js`, `NativeLiquidityPositionsPanel.jsx`, `nativeVmTokenRegistry.js`, `NativeVmTokenPickerField.jsx`.

### First-party indexer (operators)

Same JSON shape as `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL`:

1. **Cloudflare Pages** — `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL=/api/native-dex-indexer-stats`. Bind `NATIVE_DEX_INDEXER_KV` in `frontend/wrangler.toml`.
2. **CLI** — from `frontend/`: `npm run indexer:native-dex` (see `.env.example`).
3. **GitHub Actions** — `.github/workflows/native-dex-indexer.yml`.

Core: `frontend/indexer/buildNativeDexIndexerStats.mjs`.

Example indexer JSON:

```json
{
  "updatedAt": "2026-04-08T12:00:00Z",
  "tokenDirectory": [
    { "id": "0x…64hex…", "symbol": "TKA", "name": "Token A" }
  ],
  "pools": [
    {
      "poolHex": "0x7247ddc3180fdc4d3fd1e716229bfa16bad334a07d28aa9fda9ad1bfa7bdacc3",
      "volume24hApprox": "12345",
      "swapCount24h": 12,
      "tvlUsdApprox": "1234.56"
    }
  ]
}
```

---

## 5. Frontend env (native DEX)

Prefer `frontend/.env.example`. Commonly used:

| Env var | Purpose |
|---------|---------|
| `REACT_APP_BOING_NATIVE_AMM_POOL` | Override native CP pool `AccountId`. |
| `REACT_APP_BOING_NATIVE_VM_DEX_FACTORY` | Factory module id. |
| `REACT_APP_BOING_NATIVE_VM_SWAP_ROUTER` | Router module id. |
| `REACT_APP_BOING_NATIVE_VM_LIQUIDITY_LOCKER` | Locker module id. |
| `REACT_APP_BOING_NATIVE_DEX_LEDGER_ROUTER_V2` / `_V3` | Ledger router ids. |
| `REACT_APP_BOING_NATIVE_AMM_LP_VAULT` / `_LP_SHARE_TOKEN` | Vault / share token. |
| `REACT_APP_BOING_L1_DEX_DOCS_URL` | Optional public URL for this documentation (in-app banners). |
| `REACT_APP_BOING_EXPLORER_BASE_URL` | Optional HTTPS explorer base. |
| `REACT_APP_BOING_NATIVE_VM_DEX_UI` | `1` when factory/router UI is fully wired. |
| `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL` | HTTPS JSON merged into Pools + stats strip. |
| `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL` | Worker origin for D1 directory merge. |
| `REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK` | Inclusive from-block for factory `register_pair` logs. |

Discovery-specific flags: [native-dex-discovery.md](./native-dex-discovery.md).

**Pages / Worker (not `REACT_APP_*`):** `NATIVE_DEX_INDEXER_KV`, `BOING_TESTNET_RPC_URL`, `NATIVE_DEX_INDEXER_API_DISABLE`, etc.

---

## 6. Related repositories

- **Boing node / VM / SDK:** [boing.network](https://github.com/Boing-Network/boing.network)
- **Partner backlog:** [HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md)
- **RPC URLs / chain IDs:** [THREE-CODEBASE-ALIGNMENT.md](https://github.com/Boing-Network/boing.network/blob/main/docs/THREE-CODEBASE-ALIGNMENT.md)
- **Canonical testnet pool:** [OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md](https://github.com/Boing-Network/boing.network/blob/main/docs/OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md)

This repo consumes `boing-sdk` via `file:../boing.network/boing-sdk` (keep that checkout ≥ 0.3.0 for list-RPC helpers).
