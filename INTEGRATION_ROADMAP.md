# Boing.Finance Integration Roadmap

This document defines the implementation order for blockchain network integration. **Solana is Phase 1** (separate stack). **EVM networks follow in Phase 2**, ordered by user activity (most to least).

---

## Phase 1: Solana (First)

**Status:** Not started  
**Scope:** See [SOLANA_INTEGRATION_PLAN.md](./SOLANA_INTEGRATION_PLAN.md)

| Milestone | Description |
|-----------|-------------|
| 1.1 | Solana wallet connection (Phantom, Solflare, Backpack) |
| 1.2 | SPL token deployment (Deploy Token feature) |
| 1.3 | Swap integration (Jupiter API) |
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
| 7 | **Avalanche C-Chain** | 43114 | ~40K+ | ~$900M | Medium | Not started |
| 8 | **zkSync Era** | 324 | Growing | ~$500M | Medium | Not started |
| 9 | **Linea** | 59144 | Growing | ~$125M | Medium | Not started |
| 10 | **Scroll** | 534352 | Growing | ~$205M | Medium | Not started |
| 11 | **Mantle** | 5000 | Growing | ~$278M | Medium | Not started |
| 12 | **Blast** | 81457 | Growing | — | Medium | Not started |
| 13 | **Fantom** | 250 | Lower | ~$100M | Low | Not started |
| 14 | **opBNB** | 204 | Growing | — | Low | Not started |
| 15 | **Mode** | 34443 | Lower | — | Low | Not started |

---

## Per-Network Integration Checklist (EVM)

For each EVM network in Phase 2:

- [ ] Add/verify config in `frontend/src/config/networks.js`
- [ ] Add/verify config in `frontend/src/config/contracts.js`
- [ ] Deploy TokenFactory + TokenImplementation (if not yet deployed)
- [ ] Deploy DEXFactory, DEXRouter, LiquidityLocker, WETH (if full DEX)
- [ ] Add Chainlink/price feeds for PriceOracle (if applicable)
- [ ] Update CrossChainBridge chain config (if applicable)
- [ ] Test token deployment + swap flows
- [ ] Verify contracts on block explorer

---

## Summary

1. **Phase 1:** Solana — full integration (wallet, token deploy, swap, portfolio)
2. **Phase 2:** EVM networks in order: BSC → Ethereum → Base → Arbitrum → Polygon → Optimism → Avalanche → zkSync → Linea → Scroll → Mantle → Blast → Fantom → opBNB → Mode

---

*Last updated: February 2025*
