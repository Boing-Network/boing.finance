# Boing.Finance Network Integration

This document covers how we onboard and integrate blockchain networks: **prioritize by user activity**, **integrate with maximum capabilities**, and use top-notch standards (secure, reliable, feature-rich). See [adding-a-network.md](adding-a-network.md) for step-by-step instructions to add a new chain.

---

## 1. Prioritization: Most Active Users First

Networks are integrated **in order of user activity**. We use industry metrics to rank:

| Metric | Source | Use |
|--------|--------|-----|
| **TVL** | [DefiLlama](https://defillama.com/chains) | DeFi engagement, liquidity depth |
| **7-day Active Addresses** | DefiLlama, Dune, chain explorers | Real user activity |
| **Transaction Volume** | Block explorers | Usage intensity |
| **Ecosystem Maturity** | Protocol count, audit coverage | Reliability, tooling |

### EVM prioritization order (2025)

| Rank | Network | Chain ID | TVL (approx) | Rationale |
|------|---------|----------|--------------|------------|
| 1 | Ethereum | 1 | ~$55B | Highest TVL, industry standard |
| 2 | BNB Smart Chain | 56 | ~$5.5B | Highest EVM active addresses |
| 3 | Base | 8453 | ~$4B | Coinbase ecosystem |
| 4 | Arbitrum One | 42161 | ~$2.3B | Strong L2 DeFi |
| 5 | Polygon | 137 | ~$1B | Mature, low fees |
| 6 | Optimism | 10 | ~$1B | OP Stack |
| 7 | Avalanche C-Chain | 43114 | ~$900M | Subnets, fast finality |
| 8 | zkSync Era | 324 | ~$500M | zkEVM |
| 9 | Mantle | 5000 | ~$278M | Low fees |
| 10 | Scroll | 534352 | ~$205M | zkEVM |
| 11 | Linea | 59144 | ~$125M | ConsenSys |
| 12 | Blast | 81457 | — | L2 |
| 13 | Fantom | 250 | ~$100M | Very low fees |
| 14 | opBNB | 204 | — | BNB L2 |
| 15 | Mode | 34443 | — | Cost-focused |

**Note:** Solana (non-EVM) is integrated separately; see [solana.md](solana.md). It ranks #2 by TVL (~$6.4B).

---

## 2. Implementation order

### Phase 1: Solana (first)

**Status:** ✅ Complete. Scope: [docs/solana.md](solana.md)

- Solana wallet connection (Phantom, Solflare, Backpack)
- SPL token deployment (Deploy Token)
- Swap (Jupiter link), Pools/Liquidity (Raydium links)
- Portfolio: SOL + SPL token balances

### Phase 2: EVM networks (by user activity)

| # | Network | Chain ID | Status |
|---|---------|----------|--------|
| 1 | BSC | 56 | TokenFactory ✅, DEX — |
| 2 | Ethereum | 1 | TokenFactory ✅, DEX partial |
| 3 | Base | 8453 | TokenFactory ✅ |
| 4 | Arbitrum | 42161 | TokenFactory ✅ |
| 5 | Polygon | 137 | TokenFactory ✅ |
| 6 | Optimism | 10 | TokenFactory ✅ |
| 7 | Avalanche | 43114 | Config ✅, TokenFactory pending |
| 8 | zkSync Era | 324 | Config ✅, TokenFactory pending |
| 9 | Linea | 59144 | Config ✅ |
| 10 | Scroll | 534352 | Config ✅ |
| 11 | Mantle | 5000 | Config ✅ |
| 12 | Blast | 81457 | Config ✅ |
| 13 | Fantom | 250 | Config ✅ |
| 14 | opBNB | 204 | Config ✅ |
| 15 | Mode | 34443 | Config ✅ |

---

## 3. Maximum capabilities per network

When integrating a network, aim for **full capability** within the app.

### Core capabilities (EVM)

| Capability | Contracts / Services | Security |
|------------|----------------------|----------|
| Deploy Token | TokenFactory, TokenImplementation | ERC-20, verified, input validation |
| Create NFT | NFT factory or direct mint | ERC-721, metadata standards |
| Swap | DEXRouter, DEXFactory, or aggregator | Slippage, deadline, balance checks |
| Pools / Liquidity | DEXFactory, DEXRouter, LiquidityLocker | LP token handling |
| Create Pool | DEXFactoryV2 | Pair creation, initial liquidity |
| Portfolio | Balance API, token lists | Error handling |
| Bridge | CrossChainBridge or Li.Fi | Route validation |
| Price Feeds | PriceOracle, Chainlink | Stale checks, fallbacks |

### Feature readiness checklist (per network)

- [ ] Config – `networks.js`, `contracts.js`, RPC, explorer, WETH
- [ ] TokenFactory – Deployed, verified, SERVICE_CHARGES configured
- [ ] DEX – DEXFactory, DEXRouter (or external swap/pool links)
- [ ] NFT – Create NFT path (native or external)
- [ ] Portfolio – Balances load correctly
- [ ] Bridge – Cross-chain path (Boing or external)
- [ ] Security – Input validation, tx simulation, no hardcoded keys
- [ ] Documentation – User-facing copy, env vars, deployment notes

---

## 4. Security, reliability & quality

- **Security:** No private keys in frontend; input validation; tx simulation where supported; contract verification; standards compliance (ERC-20, ERC-721).
- **Reliability:** Graceful degradation (external DEX/bridge links); error handling; RPC fallbacks; loading/error/empty states.
- **Feature richness:** Plan tiers; network-specific SERVICE_CHARGES; feature gating; external integrations (Jupiter, Raydium, Li.Fi) when native not available.

---

## 5. Supported networks (summary)

| Network | Chain ID | TokenFactory | DEX | Status |
|---------|----------|--------------|-----|--------|
| Sepolia | 11155111 | ✅ | ✅ | Full |
| Ethereum | 1 | ✅ | Partial | Token deploy live |
| Base | 8453 | ✅ | — | Token deploy live |
| Polygon | 137 | ✅ | — | Token deploy live |
| BSC | 56 | ✅ | — | Token deploy live |
| Optimism | 10 | ✅ | — | Token deploy live |
| Arbitrum | 42161 | ✅ | — | Token deploy live |
| Avalanche | 43114 | Config | — | Pending |
| Fantom, Linea, zkSync, Scroll, Mantle, Blast, opBNB, Mode | various | Config | — | Config ready, deploy pending |

Cost estimates and deployment steps: [deployment.md](deployment.md).

---

*Last updated: February 2025*
