# Smart Contract Deployment Registry

This document tracks all deployed smart contracts across different networks for the boing.finance project.

## Overview

- **Project:** boing.finance
- **Contracts:** TokenFactory + TokenImplementation System
- **Last Updated:** June 29, 2025
- **Total Networks:** 7 (Ethereum, Arbitrum, Base, Polygon, BSC, Optimism, Sepolia)
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

---

## Contract System

### TokenFactory + TokenImplementation System
Professional token factory using EIP-1167 minimal proxy pattern with comprehensive security features and plan selection.

**Features:**
- ✅ EIP-1167 Minimal Proxy Pattern
- ✅ Plan Selection (Basic, Professional, Enterprise)
- ✅ Network-aware service fee system
- ✅ Comprehensive security features
- ✅ Token metadata support
- ✅ Ownership tracking
- ✅ Factory statistics
- ✅ Custom security parameter configuration

**Plan Features:**
- **Basic:** Standard ERC20 with basic functionality
- **Professional:** Anti-bot, blacklist, transaction limits, cooldown
- **Enterprise:** All Professional features + anti-whale, pause, timelock

---

## Network Deployments

### 1. Ethereum Mainnet

**Network Details:**
- **Name:** Ethereum Mainnet
- **Chain ID:** 1
- **Block Explorer:** https://etherscan.io
- **RPC Provider:** Infura

**Contract Information:**
- **TokenImplementation Address:** `0x0C4BcF0e9707266Be1543240fC613A163B5b99d1`
- **TokenFactory Address:** `0xa40Cac462b983f8F69Eb258411F588b3e575F90E`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x0C4BcF0e9707266Be1543240fC613A163B5b99d1
)
```

**Service Fee Structure (Ethereum):**
- **Basic Plan:** 0.05 ETH (~$150-200)
- **Professional Plan:** 0.15 ETH (~$450-600)
- **Enterprise Plan:** 0.3 ETH (~$900-1200)

**Verification Status:**
- **TokenImplementation:** https://etherscan.io/address/0x0C4BcF0e9707266Be1543240fC613A163B5b99d1#code
- **TokenFactory:** https://etherscan.io/address/0xa40Cac462b983f8F69Eb258411F588b3e575F90E#code
- **Status:** ✅ Deployed & Verified

---

### 2. Arbitrum One Mainnet

**Network Details:**
- **Name:** Arbitrum One Mainnet
- **Chain ID:** 42161
- **Block Explorer:** https://arbiscan.io
- **RPC Provider:** Infura

**Contract Information:**
- **TokenImplementation Address:** `0x3213695638B2748678C6bcd812e8913C25f520B5`
- **TokenFactory Address:** `0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x3213695638B2748678C6bcd812e8913C25f520B5
)
```

**Service Fee Structure (Arbitrum):**
- **Basic Plan:** 0.01 ETH (~$30-40)
- **Professional Plan:** 0.03 ETH (~$90-120)
- **Enterprise Plan:** 0.06 ETH (~$180-240)

**Verification Status:**
- **TokenImplementation:** https://arbiscan.io/address/0x3213695638B2748678C6bcd812e8913C25f520B5#code
- **TokenFactory:** https://arbiscan.io/address/0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b#code
- **Status:** ✅ Deployed & Verified

---

### 3. Base Mainnet

**Network Details:**
- **Name:** Base Mainnet
- **Chain ID:** 8453
- **Block Explorer:** https://basescan.org
- **RPC Provider:** Infura

**Contract Information:**
- **TokenImplementation Address:** `0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b`
- **TokenFactory Address:** `0x594f4560A5fd52b49E824689Ec09770DB249Eca5`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b
)
```

**Service Fee Structure (Base):**
- **Basic Plan:** 0.01 ETH (~$30-40)
- **Professional Plan:** 0.03 ETH (~$90-120)
- **Enterprise Plan:** 0.06 ETH (~$180-240)

**Verification Status:**
- **TokenImplementation:** https://basescan.org/address/0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b#code
- **TokenFactory:** https://basescan.org/address/0x594f4560A5fd52b49E824689Ec09770DB249Eca5#code
- **Status:** ✅ Deployed & Verified

---

### 4. Polygon Mainnet

**Network Details:**
- **Name:** Polygon Mainnet
- **Chain ID:** 137
- **Block Explorer:** https://polygonscan.com
- **RPC Provider:** Infura/Alchemy

**Contract Information:**
- **TokenImplementation Address:** `0x594f4560A5fd52b49E824689Ec09770DB249Eca5`
- **TokenFactory Address:** `0x1FAF7d4CAF23C1Ac79257ca74900011d2B7240A8`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x594f4560A5fd52b49E824689Ec09770DB249Eca5
)
```

**Service Fee Structure (Polygon):**
- **Basic Plan:** 25 MATIC (~$20-30)
- **Professional Plan:** 75 MATIC (~$60-90)
- **Enterprise Plan:** 150 MATIC (~$120-180)

**Verification Status:**
- **TokenImplementation:** https://polygonscan.com/address/0x594f4560A5fd52b49E824689Ec09770DB249Eca5#code
- **TokenFactory:** https://polygonscan.com/address/0x1FAF7d4CAF23C1Ac79257ca74900011d2B7240A8#code
- **Status:** ✅ Deployed & Verified

---

### 5. BSC Mainnet

**Network Details:**
- **Name:** Binance Smart Chain (BSC)
- **Chain ID:** 56
- **Block Explorer:** https://bscscan.com
- **RPC Provider:** Alchemy

**Contract Information:**
- **TokenImplementation Address:** `0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b`
- **TokenFactory Address:** `0x594f4560A5fd52b49E824689Ec09770DB249Eca5`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b
)
```

**Service Fee Structure (BSC):**
- **Basic Plan:** 0.05 BNB (~$15-25)
- **Professional Plan:** 0.15 BNB (~$45-75)
- **Enterprise Plan:** 0.3 BNB (~$90-150)

**Verification Status:**
- **TokenImplementation:** https://bscscan.com/address/0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b#code
- **TokenFactory:** https://bscscan.com/address/0x594f4560A5fd52b49E824689Ec09770DB249Eca5#code
- **Status:** ✅ Deployed & Verified

---

### 6. Optimism Mainnet

**Network Details:**
- **Name:** Optimism Mainnet
- **Chain ID:** 10
- **Block Explorer:** https://optimistic.etherscan.io
- **RPC Provider:** Infura

**Contract Information:**
- **TokenImplementation Address:** `0x84CA5c112CcEB034a2fE74f83026875c9d9f705B`
- **TokenFactory Address:** `0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x84CA5c112CcEB034a2fE74f83026875c9d9f705B
)
```

**Service Fee Structure (Optimism):**
- **Basic Plan:** 0.01 ETH (~$30-40)
- **Professional Plan:** 0.03 ETH (~$90-120)
- **Enterprise Plan:** 0.06 ETH (~$180-240)

**Verification Status:**
- **TokenImplementation:** https://optimistic.etherscan.io/address/0x84CA5c112CcEB034a2fE74f83026875c9d9f705B#code
- **TokenFactory:** https://optimistic.etherscan.io/address/0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36#code
- **Status:** ✅ Deployed & Verified

---

### 7. Sepolia Testnet

**Network Details:**
- **Name:** Sepolia Testnet
- **Chain ID:** 11155111
- **Block Explorer:** https://sepolia.etherscan.io
- **RPC Provider:** Infura

**Contract Information:**
- **TokenImplementation Address:** `0x8e576F4F8e841B9B688f71b4A92C7cED26267e68`
- **TokenFactory Address:** `0xF6837c7142A97bE35ef04148522748EA288b494b`
- **Deployment Date:** December 2024
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x8e576F4F8e841B9B688f71b4A92C7cED26267e68
)
```

**Service Fee Structure (Sepolia):**
- **Basic Plan:** 0.001 ETH (~$2-3)
- **Professional Plan:** 0.003 ETH (~$6-9)
- **Enterprise Plan:** 0.006 ETH (~$12-18)

**Verification Status:**
- **TokenImplementation:** https://sepolia.etherscan.io/address/0x8e576F4F8e841B9B688f71b4A92C7cED26267e68#code
- **TokenFactory:** https://sepolia.etherscan.io/address/0xF6837c7142A97bE35ef04148522748EA288b494b#code
- **Status:** ✅ Deployed & Verified

---

## Service Fee Structure Summary

| Network | Basic Plan | Professional Plan | Enterprise Plan |
|---------|------------|-------------------|-----------------|
| **Ethereum** | 0.05 ETH (~$150-200) | 0.15 ETH (~$450-600) | 0.3 ETH (~$900-1200) |
| **Arbitrum** | 0.01 ETH (~$30-40) | 0.03 ETH (~$90-120) | 0.06 ETH (~$180-240) |
| **Base** | 0.01 ETH (~$30-40) | 0.03 ETH (~$90-120) | 0.06 ETH (~$180-240) |
| **Polygon** | 25 MATIC (~$20-30) | 75 MATIC (~$60-90) | 150 MATIC (~$120-180) |
| **BSC** | 0.05 BNB (~$15-25) | 0.15 BNB (~$45-75) | 0.3 BNB (~$90-150) |
| **Optimism** | 0.01 ETH (~$30-40) | 0.03 ETH (~$90-120) | 0.06 ETH (~$180-240) |
| **Sepolia** | 0.001 ETH (~$2-3) | 0.003 ETH (~$6-9) | 0.006 ETH (~$12-18) |

---

## Frontend Configuration

The frontend has been automatically updated with all deployed contract addresses:

```javascript
// frontend/src/config/contracts.js
export const CONTRACTS = {
  // Ethereum Mainnet
  1: {
    tokenFactory: "0xa40Cac462b983f8F69Eb258411F588b3e575F90E",
    tokenImplementation: "0x0C4BcF0e9707266Be1543240fC613A163B5b99d1"
  },
  
  // Arbitrum One
  42161: {
    tokenFactory: "0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b",
    tokenImplementation: "0x3213695638B2748678C6bcd812e8913C25f520B5"
  },
  
  // Base
  8453: {
    tokenFactory: "0x594f4560A5fd52b49E824689Ec09770DB249Eca5",
    tokenImplementation: "0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b"
  },
  
  // Polygon
  137: {
    tokenFactory: "0x1FAF7d4CAF23C1Ac79257ca74900011d2B7240A8",
    tokenImplementation: "0x594f4560A5fd52b49E824689Ec09770DB249Eca5"
  },
  
  // BSC
  56: {
    tokenFactory: "0x594f4560A5fd52b49E824689Ec09770DB249Eca5",
    tokenImplementation: "0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b"
  },
  
  // Optimism
  10: {
    tokenFactory: "0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36",
    tokenImplementation: "0x84CA5c112CcEB034a2fE74f83026875c9d9f705B"
  },
  
  // Sepolia Testnet
  11155111: {
    tokenFactory: "0xF6837c7142A97bE35ef04148522748EA288b494b",
    tokenImplementation: "0x8e576F4F8e841B9B688f71b4A92C7cED26267e68"
  }
};
```

---

## Deployment Scripts

### Production Deployment Scripts
- **Ethereum:** `deploy-ethereum.js`
- **Arbitrum:** `deploy-arbitrum.js`
- **Base:** `deploy-base.js`
- **Polygon:** `deploy-polygon.js`
- **BSC:** `deploy-bsc.js`
- **Optimism:** `deploy-optimism.js`

### Verification Scripts
- **Ethereum:** `verify-ethereum-boing-token.js`
- **Base:** `verify-base-boing-token.js`
- **Polygon:** `verify-polygon-boing-token.js`
- **BSC:** `verify-bsc-boing-token.js`
- **Optimism:** `verify-optimism-boing-token.js`

---

## Environment Configuration

Required environment variables for deployment:

```env
# Deployer Account
DEPLOYER_PRIVATE_KEY=your_private_key

# Platform Wallet
PLATFORM_WALLET=0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2

# RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_key
ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/your_key
BASE_RPC_URL=https://base-mainnet.infura.io/v3/your_key
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your_key
BSC_RPC_URL=https://bsc-mainnet.g.alchemy.com/v2/your_key
OPTIMISM_RPC_URL=https://optimism-mainnet.infura.io/v3/your_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key

# API Keys for Verification
ETHERSCAN_API_KEY=your_etherscan_key
ARBISCAN_API_KEY=your_arbiscan_key
BASESCAN_API_KEY=your_basescan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
BSCSCAN_API_KEY=your_bscscan_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_key
```

---

## Security Features

### Available Security Features
- **Blacklist:** Enable/disable address blacklisting
- **Anti-Bot:** Enable/disable bot detection and prevention
- **Anti-Whale:** Enable/disable whale protection
- **Pause Function:** Enable/disable contract pausing
- **Timelock:** Enable/disable administrative timelock
- **Max Transaction:** Customizable maximum transaction amount
- **Max Wallet:** Customizable maximum wallet amount
- **Cooldown Period:** Customizable transaction cooldown
- **Timelock Delay:** Customizable timelock delay

### Plan-Based Security
- **Basic Plan:** Standard ERC20 with basic functionality
- **Professional Plan:** Anti-bot, blacklist, transaction limits, cooldown
- **Enterprise Plan:** All Professional features + anti-whale, pause, timelock

---

## Notes

- **TokenFactory System:** Professional token factory with EIP-1167 minimal proxy pattern
- All contracts use network-aware service fee system
- Platform wallet receives all service fees
- TokenFactory supports plan selection with different security features
- All contracts are verified on their respective block explorers
- Frontend is configured to use the TokenFactory system across all networks
- Custom security parameter configuration available for advanced users

---

*Last updated: June 29, 2025*