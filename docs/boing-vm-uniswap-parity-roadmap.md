# Toward Uniswap-level capability on Boing VM

**Product direction:** Ship and iterate native VM trading UX so it continuously approaches **Uniswap-class** discoverability, routing, and polish—without pretending the chain has EVM subgraphs or NFT positions until those layers exist.

This doc complements the phased engineering checklist in [boing-l1-dex-roadmap.md](./boing-l1-dex-roadmap.md).

## Capability matrix (what’s shipped vs ahead)

| Uniswap-style capability | Boing VM direction |
|--------------------------|---------------------|
| **Pool discovery** | **Shipped:** venues + factory pair count + search + pagination + **`register_pair` log count** (when `REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK` is set). **Shipped:** optional `pools_page` + `pools_page_size` on `/api/native-dex-indexer-stats` and Worker `GET /stats`. **Shipped (D1):** Worker `GET /v1/directory/pools?limit=&cursor=` + `GET /v1/directory/meta` — materialized from indexer sync (cron / `POST /v1/directory/sync`). See `boing.network/docs/HANDOFF_NATIVE_DEX_DIRECTORY_R2_AND_CHAIN.md`. **Shipped (opt-in):** merge directory `pools` with indexer JSON by `poolHex` when `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL` is set. **Next:** chain-native event index / subgraph-class pipeline if product requires it. |
| **Token picker** | **Shipped:** curated + directory venues + user-saved + recent + optional `REACT_APP_BOING_NATIVE_DEX_TOKEN_LIST_JSON`; **`tokenDirectory` from indexer** (merged in pickers via `indexerPickerTokens` on `BoingNativeDexIntegrationContext`). **Next:** richer on-chain metadata without indexer. |
| **Charts / TVL / volume** | **Shipped:** reserve **bars** + **time-series** (localStorage + optional indexer `history`); **first-party indexer** (CLI `npm run indexer:native-dex`, optional GET `/api/native-dex-indexer-stats`, GitHub workflow artifact); **optional CoinGecko oracle**; static USD JSON; **background reserve sampling**; in-browser AMM log scan; remote URL via `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL`. **Still upstream at scale:** long-range USD TVL, receipt-level attribution without dedicated DB. |
| **One-click multihop** | **Shipped:** Smart route + Pools prefill + URL deep link (`nativeTradeTab`, `nativeTokenIn`/`Out`, **`nativePool`** for Pools focus) + preview/broadcast/quick swap. **Swap tab:** CTA to open Smart route for multihop / other pools. **Shipped (opt-in):** unsigned simulate when `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall` (boing-sdk `simulateContractCall`); other method names still use raw JSON-RPC. Optional `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE=1` gates on `boing_rpcSupportedMethods`. **Next:** broader protocol coverage for simulate. |
| **Liquidity positions** | **Shipped:** per-pool **total LP** from pool storage; share balance per **share-token** contract; **vault↔pool map** (`REACT_APP_BOING_NATIVE_DEX_VAULT_POOL_MAP_JSON`) for multi-pool vaults; pool share % when one pool per share token. **Next:** LP NFT semantics; on-chain vault routing discovery without env map. |
| **Mobile / wallet polish** | **Shipped (incremental):** scrollable tabs, 44px targets, hash scroll. **Next:** wallet deep links, richer tx effect copy. |

## Env vars (indexer + extensions)

| Variable | Purpose |
|----------|---------|
| `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL` | HTTPS URL returning JSON merged into the Pools table (**Indexer** column) and the stats strip. |
| `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL` | Optional Worker origin for D1 directory (`GET /v1/directory/pools`). Merged into indexer `pools[]` by `poolHex` (directory base row, indexer fields overlay). See boing.network `HANDOFF_BOING_FINANCE_NATIVE_DEX_AND_DIRECTORY.md`. |
| `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_MAX_POOLS` | Cap when paging directory pools into the merge (default 2000, max 50000). |
| `REACT_APP_BOING_NATIVE_DEX_TOKEN_USD_JSON` | Static token id → USD per atomic pool unit (curated). |
| `REACT_APP_BOING_NATIVE_DEX_ORACLE_MAP_JSON` | Token id → `{ "coingeckoId", "decimals" }` for live CoinGecko USD (merges over static where present). |
| `REACT_APP_BOING_NATIVE_DEX_VAULT_POOL_MAP_JSON` | Array or `{ vaults: { "0xvault": ["0xpool", …] } }` for multi-pool vault UI. |
| `REACT_APP_BOING_NATIVE_DEX_RESERVE_SAMPLE_MS` | Interval (ms, min 10s) to re-hydrate reserves while the tab is visible; denser local chart samples. |
| `REACT_APP_BOING_NATIVE_DEX_SWAP_LOG_SCAN_BLOCKS` | Block span for on-chain AMM log scan button. |
| `REACT_APP_COINGECKO_API_KEY` | Optional; raises CoinGecko rate limits for oracle pricing. |
| `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD` | Prefer `boing_simulateContractCall` when the RPC URL hits a node that implements it (RPC-API-SPEC / boing-node). Any other name: legacy `json_rpc(method, [payload])`. Set to `off` or `0` to hide the probe UI. |
| `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE` | When `1` and the method is `boing_simulateContractCall`, require `boing_rpcSupportedMethods` to list that method before calling (skips simulate if the probe fails). |

**Pages / Worker (server-only, not `REACT_APP_*`):** `NATIVE_DEX_INDEXER_KV` (KV binding; persists history under key `native_dex_indexer_state_v1`), `NATIVE_DEX_INDEXER_TOKEN_USD_JSON`, `NATIVE_DEX_INDEXER_TOKEN_DIRECTORY_JSON`, `BOING_TESTNET_RPC_URL`, `NATIVE_DEX_INDEXER_API_DISABLE`. Standalone Worker: `boing.network/workers/native-dex-indexer` (cron + GET `/stats`).

### Example indexer JSON (`REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL`)

Shape is intentionally loose; the UI reads `pools[]` entries by `poolHex` (or `pool`).

```json
{
  "updatedAt": "2026-04-08T12:00:00Z",
  "note": "Testnet demo stats — replace with your indexer.",
  "tokenDirectory": [
    { "id": "0x…64hex…", "symbol": "TKA", "name": "Token A" }
  ],
  "pools": [
    {
      "poolHex": "0x7247ddc3180fdc4d3fd1e716229bfa16bad334a07d28aa9fda9ad1bfa7bdacc3",
      "volume24hApprox": "12345",
      "swapCount24h": 12,
      "tvlUsdApprox": "1234.56",
      "tvlApprox": "n/a"
    }
  ]
}
```

## First-party indexer (operators)

Three ways to supply the same JSON shape as `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL`:

1. **Cloudflare Pages (live)** — After deploy, set  
   `REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL=/api/native-dex-indexer-stats`  
   (same origin). Bind **`NATIVE_DEX_INDEXER_KV`** in `frontend/wrangler.toml` (or dashboard) so `history` survives cold starts; key `native_dex_indexer_state_v1`. Optional: `NATIVE_DEX_INDEXER_REGISTER_FROM_BLOCK`, `NATIVE_DEX_INDEXER_LOG_SCAN_BLOCKS`, `NATIVE_DEX_INDEXER_TOKEN_USD_JSON`, `NATIVE_DEX_INDEXER_TOKEN_DIRECTORY_JSON`, `BOING_TESTNET_RPC_URL`, `REACT_APP_BOING_NATIVE_AMM_POOL`, … Disable with `NATIVE_DEX_INDEXER_API_DISABLE=1`. Alternative: standalone Worker `workers/native-dex-indexer` or CLI + disk state.

2. **CLI + static file** — From `frontend/`:  
   `NATIVE_DEX_INDEXER_STATE_PATH=./.native-dex-indexer-state.json NATIVE_DEX_INDEXER_OUT_PATH=./public/native-dex-indexer-stats.json npm run indexer:native-dex`  
   Commit or upload the JSON; point the app at its public URL. Re-run on a cron to grow `history`.

3. **GitHub Actions** — Workflow [.github/workflows/native-dex-indexer.yml](../.github/workflows/native-dex-indexer.yml) runs on a schedule, caches state, writes `native-dex-indexer-stats.json` via `NATIVE_DEX_INDEXER_OUT_PATH`, uploads artifact. RPC + log-scan defaults live in **`frontend/env/github-native-dex-indexer.env`** (git); optional large `NATIVE_DEX_INDEXER_TOKEN_USD_JSON` / `NATIVE_DEX_INDEXER_TOKEN_DIRECTORY_JSON` may stay in repository Variables. **Optional R2 upload:** repository Variables `NATIVE_DEX_INDEXER_R2_BUCKET` and `NATIVE_DEX_INDEXER_R2_OBJECT_KEY`; job uses secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`. **Deploy workflow** [.github/workflows/deploy-frontend.yml](../.github/workflows/deploy-frontend.yml): SPA indexer URLs come from **`frontend/env/github-build.production.env`** / **`github-build.staging.env`**; `wrangler pages deploy` applies `frontend/wrangler.toml` (KV + Function vars such as `BOING_TESTNET_RPC_URL`).

**Indexer API pagination:** `GET …/api/native-dex-indexer-stats?pools_page=0&pools_page_size=50` (and the same query on the standalone Worker `/stats`) returns a sliced `pools` array plus `poolsPageMeta`. The main app still fetches the full document (no pagination) so pool rows and venues stay aligned.

Core module: `frontend/indexer/buildNativeDexIndexerStats.mjs`.

## Near-term implementation notes (frontend)

- **Context:** `BoingNativeDexIntegrationContext` exposes `dexDirectoryExtras`, `remoteIndexerStats`, `indexerPickerTokens`, `localPoolActivity`, `oracleUsdByToken`, `vaultPoolMappings`, `reserveSampleIntervalMs`.
- **LP share balance:** `frontend/src/services/boingNativeLpShareBalance.js` + `NativeLiquidityPositionsPanel.jsx`.
- **Unsigned simulate:** `tryBoingUnsignedContractSimulate` in `boingNativeVm.js` (SDK path for `boing_simulateContractCall`); Smart route panel probe block.
- **Directory + indexer merge:** `mergeRemoteIndexerWithDirectoryPools` in `nativeDexIndexerDirectoryMerge.js` (optional `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL`).
- **Native trade hub:** `#boing-native-trade` on `/swap` — tabs Swap | Pools | Smart route | **Your liquidity** (`NativeBoingTradeHub`). Query: `nativeTradeTab`, `nativeTokenIn` / `nativeTokenOut` (prefill route, then stripped), `nativePool` (Pools tab + chart focus, then stripped).
- **Pools charts:** `NativePoolsLiquidityChart.jsx` (bars), `NativePoolsReserveHistoryChart.jsx` (time series), `NativeDexPoolMetricsPanel.jsx` (log scan).
- **Route preview:** `boingExpressContractCallSignSimulateUntilOk` + `submitBoingSignedTransaction` in `NativeDexDirectoryRoutePanel`.
- **Token registry:** `frontend/src/services/nativeVmTokenRegistry.js`.
- **Picker UI:** `frontend/src/components/NativeVmTokenPickerField.jsx`.

When picking up a task in this area, prefer extending these pieces before adding parallel abstractions.
