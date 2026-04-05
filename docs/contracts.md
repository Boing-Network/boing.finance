# Smart Contract Deployment Requirements

Which features require smart contract deployments and which work with APIs only.

## Current Status

### ✅ Deployed

- **TokenFactory System:** Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Sepolia
- **DEXFactory System:** Sepolia only (testing)

### Features Summary


| Feature         | Contracts required    | Status                     |
| --------------- | --------------------- | -------------------------- |
| Deploy Token    | TokenFactory          | ✅ All mainnets             |
| Create Pool     | DEXFactory, DEXRouter | ⚠️ Sepolia only            |
| Swap            | Optional (DEXRouter)  | ✅ Via external DEXs on all |
| Liquidity       | DEXFactory            | ⚠️ Sepolia only            |
| Bridge          | Optional              | ✅ Via external bridges     |
| Portfolio       | No                    | ✅ API only                 |
| Analytics       | No                    | ✅ API only                 |
| Tokens (browse) | No                    | ✅ API only                 |


## Deployment Priority

1. **High:** Deploy DEXFactory system to all mainnets (Create Pool, Liquidity).
2. **Medium:** DEXRouter, LiquidityLocker on mainnets.
3. **Low:** Native CrossChainBridge (or keep using external bridges).

## API-Only Features

Portfolio, Analytics, and Tokens discovery work with CoinGecko, RPC, Etherscan, etc. No contract deployment needed.

## Cost Estimates

Rough gas per network: Ethereum ~$1000–1600; L2s (Arbitrum, Base, Optimism) ~$10–30; Polygon/BSC ~$1–6.

---

**Deployed addresses and verification links:** [contract-registry.md](contract-registry.md)