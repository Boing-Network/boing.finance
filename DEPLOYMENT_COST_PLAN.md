# Boing.Finance Deployment Cost Plan

**Objective:** Deploy all features on all widely-used EVM networks so users have full capability (Deploy Token, Create NFT, Swap, Pools, Liquidity, Create Pool, Bridge) on every network.

**Last updated:** February 2025  
**Note:** Costs are estimates. Gas prices and native token prices vary; always check current rates before deployment.

---

## 1. Feature-to-Contract Mapping

| Feature | Required Contracts | Gas Estimate (approx) |
|---------|--------------------|------------------------|
| **Deploy Token** | TokenFactory, TokenImplementation | ~2–3M gas (factory + impl) |
| **Create NFT** | ERC-721 factory or direct mint* | ~1–2M gas (if factory) |
| **Swap** | DEXRouter, DEXFactory, WETH | ~3–4M gas |
| **Pools / Liquidity / Create Pool** | DEXFactoryV2, DEXRouter, LiquidityLocker | ~4–5M gas combined |
| **Bridge** | CrossChainBridge | ~2–3M gas |
| **Price Feeds** | PriceOracle (+ Chainlink feeds)** | ~1–2M gas |

\* Create NFT can use direct ERC-721 mint or a factory. Factory adds ~1–2M gas.  
\*\* PriceOracle depends on Chainlink feed availability per network; some chains may skip or use fallback.

**Total gas per full suite (all features):** ~12–18M gas

---

## 2. Contracts to Deploy per Network (Full Feature Set)

| Contract | Purpose | Typical Gas |
|----------|---------|-------------|
| TokenImplementation | ERC-20 template | ~500K |
| TokenFactory | Deploy tokens | ~1.5M |
| WETH | Wrapped native (if not exist) | ~300K (most chains have it) |
| DEXFactoryV2 | Create pairs, pools | ~2M |
| DEXRouter | Swap routing | ~1.5M |
| LiquidityLocker | Lock LP tokens | ~1M |
| PriceOracle | Price feeds | ~1M |
| CrossChainBridge | Cross-chain transfers | ~2M |
| NFT Factory (optional) | ERC-721 mint | ~1.5M |

**Approx. total gas per network:** ~10–15M gas (WETH often pre-exists)

---

## 3. Per-Network Cost Estimates (Full Suite)

Costs in **USD** at typical gas prices. Use Low / Mid / High as a planning range.

| Network | Chain ID | Native | Est. Gas (full suite) | Low | Mid | High | Notes |
|---------|----------|--------|------------------------|-----|-----|------|------|
| **Ethereum** | 1 | ETH | ~12M | $150 | $400 | $900+ | Highest cost; deploy during low gas |
| **BSC** | 56 | BNB | ~12M | $2 | $8 | $25 | High volume, low cost |
| **Base** | 8453 | ETH | ~12M | $0.50 | $2 | $6 | Coinbase L2, very cheap |
| **Arbitrum** | 42161 | ETH | ~12M | $1 | $4 | $15 | High TVL |
| **Polygon** | 137 | MATIC | ~12M | $0.20 | $0.80 | $3 | Very low fees |
| **Optimism** | 10 | ETH | ~12M | $1.50 | $5 | $20 | OP Stack |
| **Avalanche** | 43114 | AVAX | ~12M | $1 | $4 | $15 | C-Chain EVM |
| **zkSync Era** | 324 | ETH | ~12M | $0.50 | $2 | $8 | zkEVM |
| **Linea** | 59144 | ETH | ~12M | $0.50 | $2 | $8 | ConsenSys |
| **Scroll** | 534352 | ETH | ~12M | $0.50 | $2 | $8 | zkEVM |
| **Polygon zkEVM** | 1101 | ETH | ~12M | $0.50 | $2 | $8 | zkEVM |
| **Mantle** | 5000 | MNT | ~12M | $0.20 | $0.80 | $3 | Very low fees |
| **Blast** | 81457 | ETH | ~12M | $0.50 | $2 | $8 | L2 |
| **Fantom** | 250 | FTM | ~12M | $0.10 | $0.50 | $2 | Very cheap |
| **opBNB** | 204 | BNB | ~12M | $0.10 | $0.40 | $1.50 | BNB L2 |
| **Mode** | 34443 | ETH | ~12M | $0.10 | $0.50 | $2 | Low cost |
| **Sepolia** | 11155111 | ETH | ~12M | $0.50 | $1.50 | $5 | Testnet (already deployed) |

---

## 4. Phased Cost Summary

### Phase 1: Already Have TokenFactory (7 networks)

| Network | DEX + Bridge + Oracle Still Needed? | Est. Cost (Mid) |
|---------|-------------------------------------|-----------------|
| Ethereum | Yes (DEX, Bridge, Oracle) | ~$300–600 |
| BSC | Yes | ~$5–15 |
| Base | Yes | ~$1–4 |
| Arbitrum | Yes | ~$3–10 |
| Polygon | Yes | ~$0.60–2 |
| Optimism | Yes | ~$4–15 |
| Sepolia | No (full suite deployed) | $0 |

**Phase 1 subtotal:** ~$315–650 (to complete full suite where TokenFactory exists)

### Phase 2: Full Deployment (9 networks)

| Network | Est. Cost (Mid) |
|---------|-----------------|
| Avalanche | $2–8 |
| zkSync Era | $1–6 |
| Linea | $1–6 |
| Scroll | $1–6 |
| Polygon zkEVM | $1–6 |
| Mantle | $0.50–3 |
| Blast | $1–6 |
| Fantom | $0.30–2 |
| opBNB | $0.20–1.50 |
| Mode | $0.30–2 |

**Phase 2 subtotal:** ~$8–46

### Grand Total (All 17 Networks, Full Features)

| Scenario | Total USD |
|----------|-----------|
| **Low (best gas)** | ~$160 |
| **Mid (typical)** | ~$430 |
| **High (worst gas)** | ~$1,000+ |

*Excludes Ethereum at peak gas; add $200–500 more if deploying on Ethereum during congestion.*

---

## 5. Native Token Budget per Network

Hold this much native token before deploying (Mid scenario):

| Network | Native | Approx. Amount |
|---------|--------|----------------|
| Ethereum | ETH | 0.15–0.25 |
| BSC | BNB | 0.02–0.05 |
| Base | ETH | 0.001–0.003 |
| Arbitrum | ETH | 0.003–0.008 |
| Polygon | MATIC | 5–15 |
| Optimism | ETH | 0.004–0.01 |
| Avalanche | AVAX | 0.2–0.5 |
| zkSync Era | ETH | 0.001–0.004 |
| Linea | ETH | 0.001–0.004 |
| Scroll | ETH | 0.001–0.004 |
| Polygon zkEVM | ETH | 0.001–0.004 |
| Mantle | MNT | 5–20 |
| Blast | ETH | 0.001–0.004 |
| Fantom | FTM | 5–15 |
| opBNB | BNB | 0.005–0.02 |
| Mode | ETH | 0.0005–0.002 |

---

## 6. Deployment Order Recommendation

1. **Cheapest first (validate flow):** opBNB, Mode, Fantom, Mantle  
2. **High-activity L2s:** Base, Arbitrum, Polygon, Optimism  
3. **Expansion:** Avalanche, zkSync, Linea, Scroll, Blast  
4. **Ethereum last:** Deploy when gas is low (< 30 gwei)

---

## 7. Cost-Saving Tips

- **Batch deployments** where possible (e.g. same script, multiple networks)
- **Deploy during low-traffic hours** (weekends, late night UTC)
- **Use gas price oracles** (e.g. Blocknative) before sending
- **Ethereum:** Wait for gas < 20 gwei; can save 50%+ vs. peak
- **Skip PriceOracle** on chains without Chainlink feeds; use external APIs as fallback
- **NFT:** Use direct mint (no factory) to save ~1.5M gas per network

---

## 8. Verification & Contingency

| Item | Buffer |
|------|--------|
| Contract verification (Etherscan, etc.) | ~10–20% of deploy cost |
| Failed tx retries | ~5–10% |
| Testing / dry runs | 1 testnet deployment (~$2–5) |
| **Recommended contingency** | **+20–30%** on total budget |

**Adjusted grand total (with contingency):** ~$520–1,300

---

## References

- [BLOCKCHAIN_NETWORK_INTEGRATION.md](./BLOCKCHAIN_NETWORK_INTEGRATION.md) – Network profiles
- [MAINNET_DEPLOYMENT_GUIDE.md](./MAINNET_DEPLOYMENT_GUIDE.md) – Deployment steps
- [L2 Fees](https://l2fees.info) – Real-time L2 gas costs
- [Etherscan Gas Tracker](https://etherscan.io/gastracker) – Ethereum gas
