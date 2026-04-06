# Boing L1 vs EVM DEX (Solidity) — what runs where

This document explains how **boing.finance** treats **Boing Network L1** (chain id **6913**, Boing VM) versus **EVM chains** (Sepolia, Ethereum, Base, etc.) for DEX features.

## TL;DR

| Stack | Technology | Used on Boing L1 today? |
|--------|------------|-------------------------|
| **DEXFactoryV2, DEXRouter, LiquidityLocker, DEXPair** in `contracts/` | Solidity → EVM bytecode | **No.** These target an Ethereum-style VM (Hardhat, Sepolia deployments). |
| **Native constant-product AMM pool** | Built-in Boing execution + `ContractCall` calldata | **Yes** (single canonical pool id in config; swap / add liquidity in-app). |
| **Future “full DEX” (factory, many pairs, router, locker)** on L1 | Would be **Boing VM bytecode** (new programs), not the current `.sol` artifacts | **Not yet** — requires protocol implementation, QA-gated deploy, published `AccountId`s, then frontend wiring. |

There is **no compiler switch** that turns the existing Solidity tree into Boing VM bytecode. Boing L1 does **not** run EVM opcodes for application contracts unless an EVM execution layer were added (not the current L1 design).

## What the app does today

- **EVM networks:** Uses `ethers`, ABIs under `frontend/src/artifacts/`, and addresses from `frontend/src/config/contracts.js` (`dexFactory`, `dexRouter`, `liquidityLocker`, …).
- **Boing L1 (6913):** Uses **Boing RPC** + **Boing Express** signing. `contracts.js` defines:
  - `nativeConstantProductPool` — 32-byte pool `AccountId` (canonical testnet default + env override).
  - `nativeVm.dexFactory`, `nativeVm.swapRouter`, `nativeVm.liquidityLocker` — **placeholders** (`0x00…00`) until operators publish real module ids (`REACT_APP_BOING_NATIVE_VM_*` at build time).

See also: [boing-l1-dex-roadmap.md](./boing-l1-dex-roadmap.md).

## What “deploy the Solidity DEX on Boing” actually means

To get **parity** with the product shape of DEXFactory / Router / Locker on Boing L1, you need:

1. **On-chain programs** written for the **Boing VM** (instruction set, storage, logs, gas model) — either reimplemented from the Solidity spec or a new design that meets the same user stories.
2. **QA / deploy policy** — bytecode passes `boing_qaCheck` (and pool workflow if applicable), then **ContractDeploy** (and optional Create2) on the target network.
3. **Published ids** — 32-byte `AccountId` hex for factory, router, locker (and per-pair contracts if the design mirrors Uniswap-style pairs).
4. **App wiring** — `boing.finance` calls **`boing_simulateTransaction` / `boing_submitTransaction`** with Boing calldata (see **boing-sdk** and network docs), not `eth_call` / MetaMask for those flows.

The Solidity contracts in this repo remain a **reference design** and **Sepolia deployment source**; they are not loadable as-is on Boing VM.

## Related repositories

- **Boing node / VM / SDK:** [boing.network](https://github.com/Boing-Network/boing.network) — execution model, RPC, native AMM, reference token/NFT templates.
- **Cross-repo handoff (Express, Observer, partner dApps):** [HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md) — backlog vs what ships in the network monorepo; URLs/RPC envs remain in [THREE-CODEBASE-ALIGNMENT.md](https://github.com/Boing-Network/boing.network/blob/main/docs/THREE-CODEBASE-ALIGNMENT.md).
- **Engineering checklist (protocol):** [BOING-L1-DEX-ENGINEERING.md](https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-L1-DEX-ENGINEERING.md) — VM deploy model, QA, checklist before app wiring.

## Configuration reference (frontend)

| Env var | Purpose |
|---------|---------|
| `REACT_APP_BOING_NATIVE_AMM_POOL` | Override native CP pool `AccountId` (64 hex chars). |
| `REACT_APP_BOING_NATIVE_VM_DEX_FACTORY` | When a Boing VM factory exists, set its `AccountId`. |
| `REACT_APP_BOING_NATIVE_VM_SWAP_ROUTER` | Router module id. |
| `REACT_APP_BOING_NATIVE_VM_LIQUIDITY_LOCKER` | Locker module id. |
| `REACT_APP_BOING_L1_DEX_DOCS_URL` | Optional public URL for this documentation (shown in UI banners). |
| `REACT_APP_BOING_NATIVE_VM_DEX_UI` | Set to `1` when factory/router flows are implemented (suppresses pending-integration banner). |
