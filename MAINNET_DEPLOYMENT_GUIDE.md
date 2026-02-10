# Mainnet Deployment Guide

This guide ensures each integrated blockchain network is **mainnet-ready** with top-notch standards before deployment.

**See [DEPLOYMENT_COST_PLAN.md](./DEPLOYMENT_COST_PLAN.md)** for per-network cost estimates (full feature set: TokenFactory, DEX, Bridge, PriceOracle, NFT).

---

## Pre-Deployment Checklist (per network)

Before deploying TokenFactory and DEX contracts on any mainnet:

- [ ] **RPC configured** – Primary + fallback RPCs in `frontend/src/config/networks.js`
- [ ] **Wallet add params** – `getWalletAddChainParams()` returns valid chainId, chainName, nativeCurrency, rpcUrls, blockExplorerUrls
- [ ] **WETH/Wrapped native** – Correct address in `frontend/src/config/contracts.js`
- [ ] **SERVICE_CHARGES** – Mainnet pricing in `frontend/src/pages/DeployToken.js`
- [ ] **External links** – Swap/Bridge URLs in `frontend/src/config/networkExternalLinks.js` (fallback when DEX not deployed)
- [ ] **Hardhat network** – Entry in `contracts/hardhat.config.js` and `contracts/config/networks.js`
- [ ] **Environment variables** – Optional RPC overrides documented in `frontend/.env.example`

---

## Deployment Order (by user activity)

See [INTEGRATION_PRINCIPLES.md](./INTEGRATION_PRINCIPLES.md) for prioritization.

1. Ethereum, BSC, Base, Arbitrum, Polygon, Optimism (TokenFactory already deployed)
2. Avalanche, zkSync Era, Mantle, Scroll, Linea, Blast, Fantom, opBNB, Mode (deploy when funded)

---

## Deploy TokenFactory (per network)

```bash
cd contracts
export DEPLOYER_PRIVATE_KEY=your_private_key

# Example: Deploy to Avalanche
npx hardhat run scripts/deploy-token-factory.js --network avalanche

# Or use deploy-token-factory-multi-network.js for batch deploy
node scripts/deploy-token-factory-multi-network.js
```

After deployment:

1. Update `frontend/src/config/contracts.js` with the deployed `tokenFactory` and `tokenImplementation` addresses
2. Verify contracts on the block explorer
3. Remove placeholder `0x0000...` entries

---

## Security Checklist

- [ ] No private keys in frontend or version control
- [ ] Input validation on Deploy Token (name, symbol, decimals, supply limits)
- [ ] Transaction simulation before broadcast where supported
- [ ] Contract verification on block explorer
- [ ] Standards compliance (ERC-20, ERC-721)

---

## Network-Specific Notes

| Network   | WETH/Wrapped   | Notes                                                |
|-----------|----------------|------------------------------------------------------|
| BSC       | WBNB           | 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c          |
| Polygon   | WMATIC         | 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270          |
| Avalanche | WAVAX          | 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7          |
| Fantom    | WFTM           | 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83          |
| zkSync    | WETH           | 0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91          |
| opBNB     | WBNB           | 0x4200000000000000000000000000000000000006 (OP Stack) |
| Mode      | WETH           | 0x4200000000000000000000000000000000000006 (OP Stack) |

---

*Last updated: February 2025*
