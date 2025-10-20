# Smart Contract Deployment Registry

This document tracks all deployed smart contracts across different networks for the boing.finance project.

## Overview

- **Project:** boing.finance
- **Contracts:** TokenFactory + TokenImplementation System, DEXFactory System
- **Last Updated:** July 2, 2025
- **Total Networks:** 7 (Ethereum, Arbitrum, Base, Polygon, BSC, Optimism, Sepolia)
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`
- **Status:** ✅ TokenFactory deployed on all networks, DEXFactory deployed on Sepolia (testing phase)

---

## Contract Systems

### 1. DEXFactory System
Enhanced decentralized exchange factory with comprehensive monetization features, security measures, and liquidity pool management.

**Features:**
- ✅ Automated Market Maker (AMM) pools
- ✅ Multi-tier fee structure (0.01% - 1.0%)
- ✅ Platform fee sharing (5% to platform)
- ✅ Liquidity locking with fees (1% basic, 5% premium)
- ✅ Bridge integration with fees (2% standard, 10% fast)
- ✅ Premium services (analytics, support, custom features)
- ✅ Security features (emergency stop, blacklist, cooldown)
- ✅ Analytics and statistics tracking
- ✅ Cross-chain bridge support

**Monetization Features:**
- **Trading Fees:** 0.3% default (configurable 0.01% - 1.0%)
- **Platform Fee Share:** 5% of trading fees
- **Liquidity Locking:** 1% basic, 5% premium lock fees
- **Bridge Services:** 2% standard, 10% fast bridge fees
- **Premium Services:** Analytics (0.05 ETH), Support (0.1 ETH), Custom (0.5 ETH), Marketing (0.3 ETH)

---

### 2. TokenFactory + TokenImplementation System
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

**Contract Information (LATEST):**
- **TokenImplementation Address:** `0x75c2709245fbe56B6133515C49cD35F31533d5Dc`
- **TokenFactory Address:** `0x3c656B835dF7A16574d4612C488bE03aAd2193Fc`
- **Deployment Date:** July 2, 2025
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
    address _implementation       // 0x75c2709245fbe56B6133515C49cD35F31533d5Dc
)
```

**Service Fee Structure (Ethereum):**
- **Basic Plan:** 0.05 ETH (~$150-200)
- **Professional Plan:** 0.15 ETH (~$450-600)
- **Enterprise Plan:** 0.3 ETH (~$900-1200)

**Verification Status:**
- **TokenImplementation:** https://etherscan.io/address/0x75c2709245fbe56B6133515C49cD35F31533d5Dc#code
- **TokenFactory:** https://etherscan.io/address/0x3c656B835dF7A16574d4612C488bE03aAd2193Fc#code
- **Status:** ✅ Deployed & Verified

**Previous Deployments (For Reference):**
- **TokenImplementation:** `0x0C4BcF0e9707266Be1543240fC613A163B5b99d1` (Previous version)
- **TokenFactory:** `0xa40Cac462b983f8F69Eb258411F588b3e575F90E` (Previous version)

---

### Ethereum Mainnet Tokens

**Token Address:** `0xa2cdB9Ee051bb0b622B4f23BA0B7a819b68b7c83`
- **Name:** boing.finance
- **Symbol:** BOING
- **Decimals:** 18
- **Total Supply:** 1,000,000,000 BOING
- **Deployed By:** TokenFactory (`0x3c656B835dF7A16574d4612C488bE03aAd2193Fc`)
- **Implementation:** `0x75c2709245fbe56B6133515C49cD35F31533d5Dc`
- **Deployment Method:** UI Application
- **Transaction Hash:** `0x6a3bbb52750f7908df7d315e3f812b924ec98f74215cc7464feb5da85e723d8c`
- **Block Number:** 22830354
- **Gas Used:** 1,324,263
- **Deployment Date:** July 2, 2025, 08:29:59 UTC
- **Status:** ✅ Deployed on Ethereum Mainnet
- **Block Explorer:** https://etherscan.io/token/0xa2cdB9Ee051bb0b622B4f23BA0B7a819b68b7c83

**Token Metadata:**
- **Website:** https://boing.finance
- **Description:** The ultimate multi-network DeFi platform for cross-chain trading, token deployment, and comprehensive financial tools across Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base networks.

**Social Links:**
- **Twitter:** https://x.com/boing_finance
- **Telegram:** https://t.me/boing_finance
- **Discord:** https://discord.gg/7RDtQtQvBW

**Security Features:**
- ✅ **Mint Authority Removed:** Yes
- ✅ **Freezing Authority:** 0xb24c5A62F8Da57967A08e11c88Fe18904f49920E
- ✅ **Max Transaction Amount:** 10,000,000 BOING (1%)
- ✅ **Anti-Bot Protection:** Enabled
- ✅ **Cooldown Period:** 30 seconds
- ✅ **Anti-Whale Protection:** Enabled
- ✅ **Pause Function:** Available
- ✅ **Timelock:** Enabled (24 hours delay)
- ✅ **Max Wallet Amount:** 20,000,000 BOING (2%)

**Service Information:**
- **Service Fee:** 0.3 ETH (Enterprise Plan)
- **Platform Wallet:** 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2

**Notes:** Token deployed through the app's UI interface with comprehensive security features. Ready for trading and liquidity provision.

---

### 2. Arbitrum One Mainnet

**Network Details:**
- **Name:** Arbitrum One Mainnet
- **Chain ID:** 42161
- **Block Explorer:** https://arbiscan.io
- **RPC Provider:** Infura

**Contract Information (LATEST):**
- **TokenImplementation Address:** `0x84CA5c112CcEB034a2fE74f83026875c9d9f705B`
- **TokenFactory Address:** `0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36`
- **Deployment Date:** July 2, 2025
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

**Service Fee Structure (Arbitrum):**
- **Basic Plan:** 0.01 ETH (~$20-30)
- **Professional Plan:** 0.03 ETH (~$60-90)
- **Enterprise Plan:** 0.06 ETH (~$120-180)

**Verification Status:**
- **TokenImplementation:** https://arbiscan.io/address/0x84CA5c112CcEB034a2fE74f83026875c9d9f705B#code
- **TokenFactory:** https://arbiscan.io/address/0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36#code
- **Status:** ✅ Deployed & Verified

**Previous Deployments (For Reference):**
- **TokenImplementation:** `0x3213695638B2748678C6bcd812e8913C25f520B5` (Previous version)
- **TokenFactory:** `0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b` (Previous version)

---

### 3. Base Mainnet

**Network Details:**
- **Name:** Base Mainnet
- **Chain ID:** 8453
- **Block Explorer:** https://basescan.org
- **RPC Provider:** Infura

**Contract Information (LATEST - Enhanced Version):**
- **TokenImplementation Address:** `0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3`
- **TokenFactory Address:** `0xBC0180d73C45901eC98eebeB3a97cF2BC8f8d5Ef`
- **Deployment Date:** January 30, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**Key Features in This Deployment:**
- ✅ **Enhanced Token Implementation:** Latest version with improved security features
- ✅ **Fixed Name/Symbol Issue:** Resolved storage collision between custom `_name`/`_symbol` variables and OpenZeppelin ERC20 storage
- ✅ **Proper Metadata Display:** Tokens now show name, symbol, logo, and metadata correctly on Basescan
- ✅ **Comprehensive Security Features:** Anti-bot, blacklist, transaction limits, cooldown, anti-whale, pause, timelock

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3
)
```

**Service Fee Structure (Base):**
- **Basic Plan:** 0.01 ETH (~$30-40)
- **Professional Plan:** 0.03 ETH (~$90-120)
- **Enterprise Plan:** 0.06 ETH (~$180-240)

**Verification Status:**
- **TokenImplementation:** https://basescan.org/address/0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3#code
- **TokenFactory:** https://basescan.org/address/0xBC0180d73C45901eC98eebeB3a97cF2BC8f8d5Ef#code
- **Status:** ✅ Deployed & Verified

**Previous Deployments (For Reference):**
- **TokenImplementation:** `0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b` (Previous version)
- **TokenFactory:** `0x594f4560A5fd52b49E824689Ec09770DB249Eca5` (Previous version)

---

### Base Mainnet Tokens

**Token Address:** `0x4e234Ab67d574260690a5f7f3f0dE703e15E8Fe9`
- **Deployed By:** TokenFactory (`0xBC0180d73C45901eC98eebeB3a97cF2BC8f8d5Ef`)
- **Implementation:** `0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3`
- **Deployment Method:** UI Application
- **Transaction Hash:** `0xf6feba210f3e40920b8b26758bcc57a68f0a9f306b09181b4993d8594a91de89`
- **Status:** ✅ Deployed on Base
- **Block Explorer:** https://basescan.org/token/0x4e234Ab67d574260690a5f7f3f0dE703e15E8Fe9
- **Notes:** Token deployed through the app's UI interface. Ready for verification.

---

### 4. Polygon Mainnet

**Network Details:**
- **Name:** Polygon Mainnet
- **Chain ID:** 137
- **Block Explorer:** https://polygonscan.com
- **RPC Provider:** Infura/Alchemy

**Contract Information (LATEST - Fixed Name/Symbol Issue):**
- **TokenImplementation Address:** `0xB210Cd7D62f4788943d57e6bb13d33B723393aD7`
- **TokenFactory Address:** `0xDb165D34B49f21FE6773FE27E3e61BE6E1c2C7cc`
- **Deployment Date:** January 30, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`

**Key Fixes in This Deployment:**
- ✅ **Fixed Name/Symbol Issue:** Resolved storage collision between custom `_name`/`_symbol` variables and OpenZeppelin ERC20 storage
- ✅ **Proper Metadata Display:** Tokens now show name, symbol, logo, and metadata correctly on Polygonscan
- ✅ **Enhanced Token Implementation:** Uses `_tokenName` and `_tokenSymbol` variables to avoid conflicts
- ✅ **Correct Override Functions:** `name()` and `symbol()` functions now return the correct values

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0xB210Cd7D62f4788943d57e6bb13d33B723393aD7
)
```

**Service Fee Structure (Polygon):**
- **Basic Plan:** 25 MATIC (~$20-30)
- **Professional Plan:** 75 MATIC (~$60-90)
- **Enterprise Plan:** 150 MATIC (~$120-180)

**Verification Status:**
- **TokenImplementation:** https://polygonscan.com/address/0xB210Cd7D62f4788943d57e6bb13d33B723393aD7#code
- **TokenFactory:** https://polygonscan.com/address/0xDb165D34B49f21FE6773FE27E3e61BE6E1c2C7cc#code
- **Status:** ✅ Deployed & Verified

**Previous Deployments (For Reference):**
- **TokenImplementation:** `0x594f4560A5fd52b49E824689Ec09770DB249Eca5` (Name/Symbol Issue)
- **TokenFactory:** `0x1FAF7d4CAF23C1Ac79257ca74900011d2B7240A8` (Name/Symbol Issue)

---

### 5. BSC Mainnet

**Network Details:**
- **Name:** Binance Smart Chain (BSC)
- **Chain ID:** 56
- **Block Explorer:** https://bscscan.com
- **RPC Provider:** Alchemy

**Contract Information (LATEST - Enhanced Version):**
- **TokenImplementation Address:** `0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36`
- **TokenFactory Address:** `0xB210Cd7D62f4788943d57e6bb13d33B723393aD7`
- **Deployment Date:** January 30, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`
- **Deployment Hash:** `0x0719b51b4d559b449a29d404da6bb51f1d4d7d4b0f46414a6ea6f0cd17719b4d`

**Key Features in This Deployment:**
- ✅ **Enhanced Token Implementation:** Latest version with improved security features
- ✅ **Fixed Name/Symbol Issue:** Resolved storage collision between custom `_name`/`_symbol` variables and OpenZeppelin ERC20 storage
- ✅ **Proper Metadata Display:** Tokens now show name, symbol, logo, and metadata correctly on BSCScan
- ✅ **Comprehensive Security Features:** Anti-bot, blacklist, transaction limits, cooldown, anti-whale, pause, timelock

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36
)
```

**Service Fee Structure (BSC):**
- **Basic Plan:** 0.05 BNB (~$15-25)
- **Professional Plan:** 0.15 BNB (~$45-75)
- **Enterprise Plan:** 0.3 BNB (~$90-150)

**Verification Status:**
- **TokenImplementation:** https://bscscan.com/address/0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36#code
- **TokenFactory:** https://bscscan.com/address/0xB210Cd7D62f4788943d57e6bb13d33B723393aD7#code
- **Status:** ✅ Deployed & Verified

**Previous Deployments (For Reference):**
- **TokenImplementation:** `0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b` (Previous version)
- **TokenFactory:** `0x594f4560A5fd52b49E824689Ec09770DB249Eca5` (Previous version)

---

### BSC Mainnet Tokens

**Token Address:** `0x3809C6537e4795755Cabe5B4cc6aEA67e2B67698`
- **Deployed By:** TokenFactory (`0xB210Cd7D62f4788943d57e6bb13d33B723393aD7`)
- **Implementation:** `0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36`
- **Deployment Method:** UI Application
- **Transaction Hash:** `0xc3deae69a40dca38f01da7ccc05eb979e0cb9098437b2fdbf4067d671d0c5d59`
- **Status:** ✅ Deployed & Verified on BSC
- **Block Explorer:** https://bscscan.com/token/0x3809C6537e4795755Cabe5B4cc6aEA67e2B67698
- **Notes:** Token deployed through the app's UI interface. Contract already verified on BSCScan.

---

### 6. Optimism Mainnet

**Network Details:**
- **Name:** Optimism Mainnet
- **Chain ID:** 10
- **Block Explorer:** https://optimistic.etherscan.io
- **RPC Provider:** Infura

**Contract Information (LATEST - Enhanced Version):**
- **TokenImplementation Address:** `0x61907A03243513931196023FA4Ac31Ec8Df3Def4`
- **TokenFactory Address:** `0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3`
- **Deployment Date:** January 30, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2`
- **Deployment Hash:** `0x52af8b99b60e6925fdb677e5bbc945d8345121443bc402ca48f7e3311b484c7a`

**Key Features in This Deployment:**
- ✅ **Enhanced Token Implementation:** Latest version with improved security features
- ✅ **Fixed Name/Symbol Issue:** Resolved storage collision between custom `_name`/`_symbol` variables and OpenZeppelin ERC20 storage
- ✅ **Proper Metadata Display:** Tokens now show name, symbol, logo, and metadata correctly on Optimistic Etherscan
- ✅ **Comprehensive Security Features:** Anti-bot, blacklist, transaction limits, cooldown, anti-whale, pause, timelock

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0x7f279e722E3C4A54B62D7fA08b3AC7f109FE58E2
    address _implementation       // 0x61907A03243513931196023FA4Ac31Ec8Df3Def4
)
```

**Service Fee Structure (Optimism):**
- **Basic Plan:** 0.01 ETH (~$30-40)
- **Professional Plan:** 0.03 ETH (~$90-120)
- **Enterprise Plan:** 0.06 ETH (~$180-240)

**Verification Status:**
- **TokenImplementation:** https://optimistic.etherscan.io/address/0x61907A03243513931196023FA4Ac31Ec8Df3Def4#code
- **TokenFactory:** https://optimistic.etherscan.io/address/0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3#code
- **Status:** ✅ Deployed & Verified

**Previous Deployments (For Reference):**
- **TokenImplementation:** `0x84CA5c112CcEB034a2fE74f83026875c9d9f705B` (Previous version)
- **TokenFactory:** `0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36` (Previous version)

---

### Optimism Mainnet Tokens

**Token Address:** `0xef268cb6Ac7bDb74d2b6bC52171eD520a646D75C`
- **Deployed By:** TokenFactory (`0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3`)
- **Implementation:** `0x61907A03243513931196023FA4Ac31Ec8Df3Def4`
- **Deployment Method:** UI Application
- **Transaction Hash:** `0xe812b05aca56985123631888780da4346ed0bf492b82257a6f9aa1d4d6df8dca`
- **Status:** ✅ Deployed on Optimism
- **Block Explorer:** https://optimistic.etherscan.io/token/0xef268cb6Ac7bDb74d2b6bC52171eD520a646D75C
- **Notes:** Token deployed through the app's UI interface. Ready for verification.

---

### 7. Sepolia Testnet

**Network Details:**
- **Name:** Sepolia Testnet
- **Chain ID:** 11155111
- **Block Explorer:** https://sepolia.etherscan.io
- **RPC Provider:** Infura

**Contract Information (LATEST - Fixed Name/Symbol Issue):**
- **TokenImplementation Address:** `0x3240BA1CedFCb7876fef576493Aef88212E68cbf`
- **TokenFactory Address:** `0x04162CEFbFC104DD722c9f9a06e135995D231898`
- **Deployment Date:** January 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`

**Key Fixes in This Deployment:**
- ✅ **Fixed Name/Symbol Issue:** Resolved storage collision between custom `_name`/`_symbol` variables and OpenZeppelin ERC20 storage
- ✅ **Proper Metadata Display:** Tokens now show name, symbol, logo, and metadata correctly on Etherscan
- ✅ **Enhanced Token Implementation:** Uses `_tokenName` and `_tokenSymbol` variables to avoid conflicts
- ✅ **Correct Override Functions:** `name()` and `symbol()` functions now return the correct values

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0xb24c5A62F8Da57967A08e11c88Fe18904f49920E
    address _implementation       // 0x3240BA1CedFCb7876fef576493Aef88212E68cbf
)
```

**Service Fee Structure (Sepolia):**
- **Basic Plan:** 0.001 ETH (~$2-3)
- **Professional Plan:** 0.003 ETH (~$6-9)
- **Enterprise Plan:** 0.006 ETH (~$12-18)

**Verification Status:**
- **TokenImplementation:** https://sepolia.etherscan.io/address/0x3240BA1CedFCb7876fef576493Aef88212E68cbf#code
- **TokenFactory:** https://sepolia.etherscan.io/address/0x04162CEFbFC104DD722c9f9a06e135995D231898#code
- **Status:** ✅ Deployed & Verified

**DEXFactory System (LATEST - DEXFactoryV2 with Enhanced Features):**
- **LiquidityLocker Address:** `0x187E7ee6396B99D1b362200B62F6d02125c94044`
- **DEXFactory Address:** `0x291A02126420b53eCaAE518466Ac65C8482D3feb`
- **WETH Address:** `0x49c39B1792CCE5fAf861Ed12Cd2d89bBabfE6c5C`
- **DEXRouter Address:** `0x972c117e983AD0D97b4182b2Fb7b39635b29E47d`
- **Deployment Date:** July 5, 2025
- **Status:** ✅ Deployed & Verified (DEXFactoryV2 - Currently Active)

**DEXFactory System Features:**
- ✅ Core pair creation with CREATE2
- ✅ Basic liquidity locking/unlocking (modular architecture)
- ✅ Fee management and access control
- ✅ Emergency controls and security features
- ✅ Gas optimized and under EVM size limit
- ✅ Modular LiquidityLocker contract

**Verification Status:**
- **LiquidityLocker:** https://sepolia.etherscan.io/address/0x187E7ee6396B99D1b362200B62F6d02125c94044#code
- **DEXFactory:** https://sepolia.etherscan.io/address/0x291A02126420b53eCaAE518466Ac65C8482D3feb#code
- **WETH:** https://sepolia.etherscan.io/address/0x49c39B1792CCE5fAf861Ed12Cd2d89bBabfE6c5C#code
- **DEXRouter:** https://sepolia.etherscan.io/address/0x972c117e983AD0D97b4182b2Fb7b39635b29E47d#code

**Previous DEXFactory System (Testing Phase):**
- **DEXFactory Address:** `0x5b2bc0398F86553e88f8546E89d5E518Bb597cD2`
- **DEXRouter Address:** `0x6354A9d4f779e85CE65535845F775DFEfe31AdB8`
- **WETH Address:** `0xc832cde537bD890e9EB52fa5b8430b925C2a2A1F`
- **Status:** ✅ Deployed & Verified (Previous Version)

**Alternative DEXFactory System (Modular Architecture):**
- **DEXFactory Address:** `0x82Db4B9f008A800f32c5A9f631ff3516C7f584F5`
- **DEXRouter Address:** `0x096F3b7ce692A203F7E282c0E0dD2d872d7728dd`
- **WETH Address:** `0xE19d077Ff383F72C32706Fe66f562c4188150e73`
- **LiquidityLocker Address:** `0x543BF0f0EC5BEbeDD32c374a5D0D2c36aa85adbE`
- **Status:** ✅ Deployed & Verified (Alternative Version - Not Currently Active)

---

### 8. Sepolia Testnet (Previous Deployment - Name/Symbol Issue)

**Network Details:**
- **Name:** Sepolia Testnet
- **Chain ID:** 11155111
- **Block Explorer:** https://sepolia.etherscan.io
- **RPC Provider:** Infura

**Contract Information:**
- **TokenImplementation Address:** `0xCbCcE707b62615163d4582fC74476Dce747874B5`
- **TokenFactory Address:** `0xFCE72cbF657D39b7Bf2913865924A8229A21703d`
- **Deployment Date:** December 2024
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Platform Wallet:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`

**TokenImplementation Constructor:**
```solidity
constructor() ERC20("", "") Ownable(msg.sender)
```

**TokenFactory Constructor:**
```solidity
constructor(
    address _platformWallet,      // 0xb24c5A62F8Da57967A08e11c88Fe18904f49920E
    address _implementation       // 0xCbCcE707b62615163d4582fC74476Dce747874B5
)
```

**Service Fee Structure (Sepolia):**
- **Basic Plan:** 0.001 ETH (~$2-3)
- **Professional Plan:** 0.003 ETH (~$6-9)
- **Enterprise Plan:** 0.006 ETH (~$12-18)

**Verification Status:**
- **TokenImplementation:** https://sepolia.etherscan.io/address/0xCbCcE707b62615163d4582fC74476Dce747874B5#code
- **TokenFactory:** https://sepolia.etherscan.io/address/0xFCE72cbF657D39b7Bf2913865924A8229A21703d#code
- **Status:** ✅ Deployed & Verified

**DEXFactory Information:**
- **DEXFactory Address:** `0x5b2bc0398F86553e88f8546E89d5E518Bb597cD2`
- **Deployment Date:** June 29, 2025
- **Deployer:** `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Transaction Hash:** `0x5703f03a59fff26555088586ab6b5f43a5bb9b65cd1e9c7ff320630f9f1b04e7`

**DEXFactory Features:**
- Core DEX functionality
- Liquidity Locking (max 365 days)
- Security Controls (emergency stop, pausable, reentrancy guard, owner controls)
- Fee Rate: 0.3% (30 basis points)

**Verification Status:**
- **DEXFactory:** https://sepolia.etherscan.io/address/0x5b2bc0398F86553e88f8546E89d5E518Bb597cD2#code
- **Status:** ✅ Deployed & Verified

---

## Deployed Tokens

This section tracks individual tokens deployed through the TokenFactory contract across different networks.

### Polygon Mainnet Tokens

**Token Address:** `0x80b319347E3524bCEba5456f3aDa0438dC12A72E`
- **Token Name:** boing.finance
- **Token Symbol:** BOING
- **Decimals:** 18
- **Total Supply:** 1,000,000,000 BOING
- **Deployed By:** TokenFactory (`0xDb165D34B49f21FE6773FE27E3e61BE6E1c2C7cc`)
- **Implementation:** `0xB210Cd7D62f4788943d57e6bb13d33B723393aD7`
- **Deployment Method:** UI Application
- **Status:** ✅ Deployed on Polygon
- **Block Explorer:** https://polygonscan.com/token/0x80b319347e3524bceba5456f3ada0438dc12a72e
- **Notes:** Token deployed through the app's UI interface. Compiled with Solidity <0.4.7 (older version).

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

**Frontend Status:** ✅ Fully integrated - Pool creation feature available on Sepolia testnet

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

## DEXFactory Deployments


### Sepolia Testnet
- **Contract Address**: `0x5b2bc0398F86553e88f8546E89d5E518Bb597cD2`
- **Deployer**: `0xb24c5A62F8Da57967A08e11c88Fe18904f49920E`
- **Transaction Hash**: `0x5703f03a59fff26555088586ab6b5f43a5bb9b65cd1e9c7ff320630f9f1b04e7`
- **Block Number**: `null`
- **Features**: Core DEX functionality, Liquidity Locking, Security Controls
- **Verification**: [Etherscan](https://sepolia.etherscan.io/address/0x5b2bc0398F86553e88f8546E89d5E518Bb597cD2)
- **Deployment Date**: 2025-06-29T23:22:36.975Z
