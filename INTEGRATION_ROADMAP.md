# Boing.Finance Integration Roadmap

This document defines the implementation order for blockchain network integration. **Solana is Phase 1** (separate stack). **EVM networks follow in Phase 2**, ordered by **user activity** (most active users first).

**See [INTEGRATION_PRINCIPLES.md](./INTEGRATION_PRINCIPLES.md)** for prioritization criteria (TVL, active addresses), maximum-capabilities checklist, and security/reliability standards.

---

## Phase 1: Solana (First)

**Status:** ✅ Complete  
**Scope:** See [SOLANA_INTEGRATION_PLAN.md](./SOLANA_INTEGRATION_PLAN.md)

| Milestone | Description |
|-----------|-------------|
| 1.1 | Solana wallet connection (Phantom, Solflare, Backpack) |
| 1.2 | SPL token deployment (Deploy Token feature) |
| 1.3 | Swap integration (Jupiter link), Pools/Liquidity (Raydium links) |
| 1.4 | Portfolio: SOL + SPL token balances |

**Success gate:** Solana integration is considered successful when users can deploy SPL tokens and perform swaps via the Boing.Finance UI.

---

## Phase 2: EVM Networks (By User Activity)

Once Solana integration is successful, implement the following EVM networks **in this order**. Order is based on 7-day active addresses, TVL, and ecosystem maturity.

### Implementation Order

| # | Network | Chain ID | Est. 7-Day Active Addrs | TVL | Priority | Status |
|---|---------|----------|-------------------------|-----|----------|--------|
| 1 | **BNB Smart Chain (BSC)** | 56 | ~18.4M | ~$5B | High | TokenFactory ✅, DEX — |
| 2 | **Ethereum** | 1 | ~6.56M | ~$55B | High | TokenFactory ✅, DEX partial |
| 3 | **Base** | 8453 | High (Coinbase) | ~$4B | High | TokenFactory ✅, DEX — |
| 4 | **Arbitrum One** | 42161 | High | ~$2.3B | High | TokenFactory ✅, DEX — |
| 5 | **Polygon** | 137 | High | ~$1B | High | TokenFactory ✅, DEX — |
| 6 | **Optimism** | 10 | Medium | ~$1B | High | TokenFactory ✅, DEX — |
| 7 | **Avalanche C-Chain** | 43114 | ~40K+ | ~$900M | Medium | Config ✅, TokenFactory pending |
| 8 | **zkSync Era** | 324 | Growing | ~$500M | Medium | Config ✅, TokenFactory pending |
| 9 | **Linea** | 59144 | Growing | ~$125M | Medium | Config ✅, TokenFactory pending |
| 10 | **Scroll** | 534352 | Growing | ~$205M | Medium | Config ✅, TokenFactory pending |
| 11 | **Mantle** | 5000 | Growing | ~$278M | Medium | Config ✅, TokenFactory pending |
| 12 | **Blast** | 81457 | Growing | — | Medium | Config ✅, TokenFactory pending |
| 13 | **Fantom** | 250 | Lower | ~$100M | Low | Config ✅, TokenFactory pending |
| 14 | **opBNB** | 204 | Growing | — | Low | Config ✅, TokenFactory pending |
| 15 | **Mode** | 34443 | Lower | — | Low | Config ✅, TokenFactory pending |

---

## Per-Network Integration Checklist (EVM)

**Goal:** Maximum capabilities, secure, reliable, feature-rich. See [INTEGRATION_PRINCIPLES.md](./INTEGRATION_PRINCIPLES.md).

### Config & Deployment

- [ ] Add/verify config in `frontend/src/config/networks.js` (RPC, explorer, native currency)
- [ ] Add/verify config in `frontend/src/config/contracts.js` (WETH, TokenFactory, DEX, Bridge)
- [ ] Deploy TokenFactory + TokenImplementation
- [ ] Deploy DEXFactory, DEXRouter, LiquidityLocker (or link to external DEX)
- [ ] Deploy CrossChainBridge or configure external bridge (Li.Fi)
- [ ] Add Chainlink/price feeds for PriceOracle (if available)
- [ ] Verify all contracts on block explorer

### Capabilities & Security

- [ ] **Deploy Token** – TokenFactory live, SERVICE_CHARGES configured, input validation, tx simulation
- [ ] **Create NFT** – NFT mint path (native or external)
- [ ] **Swap** – DEX swap or external aggregator link
- [ ] **Pools / Liquidity / Create Pool** – DEX flows or external links
- [ ] **Portfolio** – Balance fetching, error handling
- [ ] **Bridge** – Cross-chain routes (Boing or external)
- [ ] Standards compliance (ERC-20, ERC-721), no private keys, graceful degradation

---

## Summary

1. **Phase 1:** Solana — full integration (wallet, token deploy, swap, portfolio)
2. **Phase 2:** EVM networks in order: BSC → Ethereum → Base → Arbitrum → Polygon → Optimism → Avalanche → zkSync → Linea → Scroll → Mantle → Blast → Fantom → opBNB → Mode

---

*Last updated: February 2025*
