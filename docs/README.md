# boing.finance — documentation index

| Doc | Description |
|-----|-------------|
| [HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md) (upstream) | Express, Observer, and partner dApp backlog aligned with `boing-sdk` and network docs. |
| [HANDOFF_Boing_Network_Global_Token_Discovery.md](./HANDOFF_Boing_Network_Global_Token_Discovery.md) | L1 vs L2 discovery architecture; operator env notes; **§9** client integration checklist. |
| [INTEGRATION_NATIVE_DEX_L1_DISCOVERY.md](./INTEGRATION_NATIVE_DEX_L1_DISCOVERY.md) | Where the frontend calls `boing_listDexTokens` / `boing_listDexPools` and related env vars. |
| [boing-l1-vs-evm-dex.md](./boing-l1-vs-evm-dex.md) | Why Solidity DEX contracts are EVM-only and how Boing L1 differs. |
| [boing-l1-dex-roadmap.md](./boing-l1-dex-roadmap.md) | Phased plan: network bytecode → published ids → app wiring. |
| [boing-vm-contracts-and-explorer.md](./boing-vm-contracts-and-explorer.md) | Boing VM deploy vs EVM; Observer transparency; what to build next. |
| [contracts.md](./contracts.md) | Contract registry overview (EVM-focused). |
| [contract-registry.md](./contract-registry.md) | Deployment addresses and history. |

**Ops:** from `frontend/`, run **`npm run smoke:boing-rpc`** to verify public Boing testnet JSON-RPC (`boing_chainHeight`, optional `boing_qaCheck` via `BOING_SMOKE_BYTECODE_HEX`).
