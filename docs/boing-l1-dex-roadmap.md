# Roadmap: full DEX experience on Boing L1 (boing.finance + network)

This is a **cross-repo** milestone list. The Solidity DEX in `contracts/` is **not** blocked by frontend work alone — **Boing VM programs** must exist before the app can offer factory/router/locker parity on L1.

## Phase 0 — Today (shipped)

- [x] Boing L1: native **constant-product** pool in config + **NativeAmmSwapPanel** (swap / add liquidity via Boing Express).
- [x] Config placeholders: `nativeVm.{dexFactory,swapRouter,liquidityLocker}` + env wiring in `contracts.js`.
- [x] EVM path unchanged: Sepolia / mainnets use **DEXFactoryV2** stack via ethers.
- [x] Docs: [boing-l1-vs-evm-dex.md](./boing-l1-vs-evm-dex.md).

## Phase 1 — Network & bytecode (blocking)

**Owner: Boing protocol / VM engineers** (see [BOING-L1-DEX-ENGINEERING.md](https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-L1-DEX-ENGINEERING.md)).

- [ ] **Calldata & storage spec** for factory (create pair / pool), router (swap paths), locker — aligned with Boing VM capabilities (no EVM assumptions).
- [ ] **Reference implementations** as Boing VM bytecode (or split modules: factory / pair / router / locker).
- [ ] **QA registry** entries and deploy purposes approved for those templates.
- [ ] **Testnet deploy** + operator publication of **AccountId**s.
- [ ] **Indexer / RPC** expectations documented (log topics, receipt layout) if the app or Observer will list pairs.

## Phase 2 — boing.finance integration

**Owner: boing.finance frontend** (can start after Phase 1 ids + calldata spec exist).

- [ ] **Read paths:** reserves, pair enumeration or subgraph — whatever the network provides.
- [ ] **Write paths:** build `ContractCall` payloads (use **boing-sdk** encoders or new ones), simulate, submit via Boing Express.
- [ ] **UX parity (incremental):** Create Pool / Swap / Liquidity flows on 6913 when `nativeVm` ids are non-zero — gated behind feature detection (`getFeatureSupport().nativeVmDex` and `REACT_APP_BOING_NATIVE_VM_DEX_UI=1` when ready).
- [ ] **Env / ops:** document required `REACT_APP_BOING_NATIVE_VM_*` for production builds.

## Phase 3 — Hardening

- [ ] Error mapping (QA reject, rate limits) consistent with existing `boingExpress` helpers.
- [ ] E2E smoke against public testnet RPC (optional CI).

## Cross-repo handoff (Boing network)

Upstream **[HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md)** lists partner dApp priorities. **boing.finance** status:

| Priority | Item | Status in this repo |
|----------|------|---------------------|
| **P0** | Canonical pool / factory ids and env mirrors vs [OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md](https://github.com/Boing-Network/boing.network/blob/main/docs/OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md) and `boing_getNetworkInfo` `end_user` hints | **Ongoing** — `boingCanonicalTestnetPool.js`, `contracts.js`, build env, plus **`BoingNativeDexIntegrationContext`** (live `fetchNativeDexIntegrationDefaults` on 6913). Re-verify when the node publishes new canonical hints. |
| **P1** | **`fetchNativeDexIntegrationDefaults`** / **`mergeNativeDexIntegrationDefaults`** | **Wired** — context + `buildNativeDexOverridesFromEnv()`; `effectivePoolHex` / `effectiveFactoryHex` feed native AMM UI and `getFeatureSupport(..., { nativeConstantProductPoolHex })`. |
| **P1** | **`nativeDexRouting`** (quotes / best path) | **Wired** — `hydrateCpPoolVenuesFromRpc` + **`findBestCpRoute`** in **NativeAmmSwapPanel**; optional multi-pool list when **`REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK`** is set (factory `register_pair` logs + hydrate). |
| **P2** | **`providerSupportsBoingNativeRpc`** | **Wired** — **`WalletContext`** blocks connect / fresh reconnect on 6913 when the injected provider fails the SDK check (steer to Boing Express). |

Verification on a `boing.network` clone: `npm run print-native-dex-routes` in `examples/native-boing-tutorial` (see that repo’s tutorial §7c3). Cross-repo smoke commands: [PRE-VIBEMINER-NODE-COMMANDS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/PRE-VIBEMINER-NODE-COMMANDS.md).

## How to track progress

1. Watch **nativeVm** env vars moving from zero to real ids on testnet builds.
2. In code, `frontend/src/services/boingNativeDexContracts.js` centralizes module id reads and TODO hooks for future calldata builders.
