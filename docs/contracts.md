# Smart Contract Deployment Requirements

Which features require smart contract deployments and which work with APIs only.

## Current Status

### ✅ Deployed

- **TokenFactory System:** Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Sepolia
- **DEXFactory System:** Sepolia only. Other listed EVM chains (except Ethereum) are **pre-funding**: wrapped native + hub tokens + deploy scripts are in repo; factory/router addresses stay zero until protocol deploy. See [evm-dex-enablement.md](evm-dex-enablement.md).

### Features Summary


| Feature         | Contracts required    | Status                     |
| --------------- | --------------------- | -------------------------- |
| Deploy Token    | TokenFactory          | ✅ All mainnets             |
| Create Pool     | DEXFactory, DEXRouter | ⚠️ Sepolia live; other EVM (not ETH) scripts ready |
| Swap            | Optional (DEXRouter)  | ✅ Via Boing DEX when factory is set; else external |
| Liquidity       | DEXFactory            | ⚠️ Sepolia live; other EVM (not ETH) scripts ready |
| Bridge          | Optional              | ✅ Via external bridges     |
| Portfolio       | No                    | ✅ API only                 |
| Analytics       | No                    | ✅ API only                 |
| Tokens (browse) | No                    | ✅ API only                 |


## Deployment Priority

1. **High:** Deploy DEXFactory system to listed EVM mainnets except Ethereum (Create Pool, Liquidity). Operator steps: [evm-dex-enablement.md](evm-dex-enablement.md).
2. **Medium:** Verify factory/router/locker; then fund via Create Pool.
3. **Low:** Native CrossChainBridge (or keep using external bridges).

## API-Only Features

Portfolio, Analytics, and Tokens discovery work with CoinGecko, RPC, Etherscan, etc. No contract deployment needed.

## Cost Estimates

Rough gas per network: Ethereum ~$1000–1600; L2s (Arbitrum, Base, Optimism) ~$10–30; Polygon/BSC ~$1–6.

---

**Deployed addresses and verification links:** [contract-registry.md](contract-registry.md)