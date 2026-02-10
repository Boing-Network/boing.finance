# Boing.Finance Integration Principles

This document defines how we onboard and integrate blockchain networks: **prioritize by user activity** and **integrate with maximum capabilities** using top-notch standards (secure, reliable, feature-rich).

---

## 1. Prioritization: Most Active Users First

Networks are integrated **in order of user activity**. We use industry metrics to rank:

| Metric | Source | Use |
|--------|--------|-----|
| **TVL (Total Value Locked)** | [DefiLlama](https://defillama.com/chains) | DeFi engagement, liquidity depth |
| **7-day Active Addresses** | DefiLlama, Dune, chain explorers | Real user activity |
| **Transaction Volume** | Block explorers | Usage intensity |
| **Ecosystem Maturity** | Protocol count, audit coverage | Reliability, tooling |

### EVM Prioritization Order (2025)

*Refreshed periodically from DefiLlama and chain analytics.*

| Rank | Network | Chain ID | TVL (approx) | Active Addrs | Rationale |
|------|---------|----------|--------------|--------------|-----------|
| 1 | Ethereum | 1 | ~$55B | ~360K | Highest TVL, industry standard |
| 2 | BNB Smart Chain | 56 | ~$5.5B | ~970K | Highest EVM active addresses |
| 3 | Base | 8453 | ~$4B | Growing | Coinbase ecosystem, fast growth |
| 4 | Arbitrum One | 42161 | ~$2.3B | High | Strong L2 DeFi ecosystem |
| 5 | Polygon | 137 | ~$1B | ~347K | Mature, low fees |
| 6 | Optimism | 10 | ~$1B | Medium | OP Stack, Superchain |
| 7 | Avalanche C-Chain | 43114 | ~$900M | ~40K+ | Subnets, fast finality |
| 8 | zkSync Era | 324 | ~$500M | Growing | zkEVM, growing ecosystem |
| 9 | Mantle | 5000 | ~$278M | Growing | BitDAO treasury, low fees |
| 10 | Scroll | 534352 | ~$205M | Growing | zkEVM, EVM-equivalent |
| 11 | Linea | 59144 | ~$125M | Growing | ConsenSys ecosystem |
| 12 | Blast | 81457 | — | Growing | Native yield, Blur ecosystem |
| 13 | Fantom | 250 | ~$100M | Lower | Very low fees |
| 14 | opBNB | 204 | — | Growing | BNB L2 |
| 15 | Mode | 34443 | — | Lower | Cost-focused |

**Note:** Solana (non-EVM) is integrated separately and ranks #2 by TVL (~$6.4B) with high activity.

---

## 2. Maximum Capabilities per Network

When integrating a network, we aim for **full capability** within the Boing.Finance app. Each network should support:

### Core Capabilities (EVM)

| Capability | Contracts / Services | Security & Standards |
|------------|----------------------|----------------------|
| **Deploy Token** | TokenFactory, TokenImplementation | ERC-20, verified, input validation, tx simulation |
| **Create NFT** | NFT factory or direct mint | ERC-721, metadata standards (e.g. OpenSea) |
| **Swap** | DEXRouter, DEXFactory, or external aggregator | Slippage protection, deadline, balance checks |
| **Pools / Liquidity** | DEXFactory, DEXRouter, LiquidityLocker | LP token handling, impermanent loss notes |
| **Create Pool** | DEXFactoryV2 (createPairWithLiquidity) | Pair creation, initial liquidity |
| **Portfolio** | Balance API, token lists | Parsed balances, error handling |
| **Bridge** | CrossChainBridge or Li.Fi/third-party | Route validation, destination checks |
| **Price Feeds** | PriceOracle, Chainlink (if available) | Stale price checks, fallbacks |

### Non-EVM (e.g. Solana)

| Capability | Implementation | Standards |
|------------|----------------|-----------|
| Deploy SPL Token | Metaplex Token Metadata, R2 storage | Metaplex v2, immutable metadata |
| Create NFT | Metaplex NFT, R2 | Metaplex standard, revoke mint authority |
| Swap | Jupiter / Raydium links | Simulation before send |
| Pools / Liquidity | Raydium links | — |
| Portfolio | getParsedTokenAccountsByOwner | Handle parse errors |

### Feature Readiness Checklist (per network)

Before marking a network as “integrated,” verify:

- [ ] **Config** – `networks.js`, `contracts.js`, RPC, explorer, WETH/wrapped native
- [ ] **TokenFactory** – Deployed, verified, SERVICE_CHARGES configured
- [ ] **DEX** – DEXFactory, DEXRouter deployed (or external swap/pool links)
- [ ] **NFT** – Create NFT path available (native or external)
- [ ] **Portfolio** – Balances load correctly
- [ ] **Bridge** – Cross-chain path (Boing or external)
- [ ] **Security** – Input validation, tx simulation, no hardcoded keys
- [ ] **Reliability** – Error handling, fallbacks, rate limiting where needed
- [ ] **Documentation** – User-facing copy, env vars, deployment notes

---

## 3. Security, Reliability & Feature Quality

### Security

- **No private keys** in frontend or version control
- **Input validation** – names, symbols, decimals, supply limits
- **Transaction simulation** before broadcast where supported
- **Contract verification** on block explorer
- **Standards compliance** – ERC-20, ERC-721, Metaplex as appropriate
- **Audit references** – Prefer audited contracts; document audit status

### Reliability

- **Graceful degradation** – External DEX/bridge links when native contracts not deployed
- **Error handling** – User-friendly messages, retry where appropriate
- **RPC fallbacks** – Multiple RPC endpoints where possible
- **State handling** – Loading, error, and empty states

### Feature Richness

- **Plan tiers** – Basic, Professional, Enterprise with clear feature matrix
- **Network-specific pricing** – SERVICE_CHARGES per chain
- **Feature gating** – Show/hide based on deployed contracts
- **External integrations** – Jupiter, Raydium, Li.Fi when native not available

---

## 4. References

- [INTEGRATION_ROADMAP.md](./INTEGRATION_ROADMAP.md) – Phased implementation order
- [BLOCKCHAIN_NETWORK_INTEGRATION.md](./BLOCKCHAIN_NETWORK_INTEGRATION.md) – Network profiles and costs
- [SOLANA_SECURITY.md](./SOLANA_SECURITY.md) – Solana-specific security practices
- [DefiLlama Chains](https://defillama.com/chains) – TVL and protocol counts
- [L2 Fees](https://l2fees.info) – L2 gas cost comparison

---

*Last updated: February 2025*
