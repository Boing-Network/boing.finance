# Native DEX L1 discovery (`boing_listDexTokens` / `boing_listDexPools`)

This document summarizes how **boing.finance** prefers **L1 Boing JSON-RPC** for token and pool discovery and still uses the **optional indexer** (`resolveNativeDexIndexerStatsUrl()`, `extractTokenDirectoryFromIndexer`) for enrichment (TVL, history, labels).

## Canonical spec

See **[HANDOFF_Boing_Network_Global_Token_Discovery.md](./HANDOFF_Boing_Network_Global_Token_Discovery.md)** (architecture, trust model, and the implementation note for `params.factory`, `light`, and operator env vars).

## Client code

| Piece | Role |
|-------|------|
| `frontend/src/services/nativeDexL1Discovery.js` | Capability detection, opaque cursor pagination, `light: true` list calls, mapping to picker rows / `PoolTokenRow` inputs. |
| `frontend/src/contexts/BoingNativeDexIntegrationContext.jsx` | Loads L1 tokens and optional L1 pools, merges with indexer + on-chain hydration. |
| `frontend/src/services/nativeDexIndexerClient.js` | Indexer URL resolution; token directory parsing (including optional `decimals`). |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `REACT_APP_BOING_NATIVE_DEX_DISCOVERY_POOLS` | Set to `0` to skip merging **`boing_listDexPools`** into `venues` (tokens-only L1 discovery). Default: on. |
| `REACT_APP_BOING_NATIVE_DEX_DISCOVERY_MAX_PAGES` | Max paginated RPC pages per list (default **100**, capped at **250**). |
| `REACT_APP_BOING_NATIVE_DEX_DISCOVERY_MIN_LIQUIDITY_WEI` | Forwarded to **`boing_listDexTokens`** when set. |
| `REACT_APP_BOING_NATIVE_DEX_DISCOVERY_MIN_RESERVE_PRODUCT` | Forwarded to **`boing_listDexTokens`** when set. |
| `REACT_APP_BOING_NATIVE_DEX_DISCOVERY_PREFLIGHT` | Set to **`1`** to run **`preflightRpc()`** in parallel with discovery (extra HTTP/RPC checks; exposes counts in **Developer tools**). Default: off. |

### RPC capability detection

`resolveNativeDexL1DiscoveryCapabilities` unions method names from **`boing_rpcSupportedMethods`** and **`boing_getRpcMethodCatalog`**. If **both** lists are empty, it **probes** `listDexTokens` / `listDexPools` once (treat **`-32601`** as absent). Optional **`preflightRpc`** does not change those flags; it only fills **`dexDiscoveryRpcMeta`** in **`BoingNativeDexIntegrationContext`**.

### Pool leg decimals

Rows from **`boing_listDexPools`** are kept as **`l1DexPoolRows`**; **`attachDexPoolDecimalsToVenues`** merges **`tokenADecimals` / `tokenBDecimals`** onto **`venues`** for the UI. **`formatNativePoolReserveDisplay`** (and **`resolveNativePoolLegDecimals`**) in `frontend/src/utils/nativePoolReserveFormat.js` format reserves when decimals are known from the venue or from the merged indexer / L1 token directory.

## `boing-sdk`

Minimum **0.3.0** for `BoingClient.listDexTokensPage`, `listDexPoolsPage`, `getDexToken`, and related types. This repo typically consumes the SDK via **`file:../boing.network/boing-sdk`**; keep that checkout at or above **0.3.0**.
