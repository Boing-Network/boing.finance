import { ethers } from 'ethers';

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

class WalletTokenService {
  constructor() {
    this.provider = null;
    this.account = null;
    this.chainId = null;
    this.debug = false;
  }

  initialize(provider, account, chainId, debug = false) {
    this.provider = provider;
    this.account = account;
    this.chainId = chainId;
    this.debug = debug;
  }

  // Get user's wallet tokens with balances
  async getUserTokens() {
    if (!this.provider || !this.account) {
      return [];
    }

    try {
      // Get native token balance (ETH, MATIC, BNB, etc.)
      const nativeBalance = await this.provider.getBalance(this.account);
      const nativeToken = this.getNativeTokenInfo(nativeBalance);

      // Get common token addresses for the current network
      const commonTokens = this.getCommonTokensForNetwork();
      
      // Get additional tokens from transaction history (for Sepolia)
      let additionalTokens = [];
      if (this.chainId === 11155111) { // Sepolia
        additionalTokens = await this.getTokensFromHistory();
        
        // Add some known Sepolia token addresses that might be missing
        const knownSepoliaTokens = [
          '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
          '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // WETH
          '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK
          '0x1c4b70D8e5C3cE5Aa44DE344d6d69a0ca12b9568', // UNI
          '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // USDT
          '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // DAI
          '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
          '0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a', // AAVE
          '0x172370d5Cd63279eFa6d502DAB29171933a610AF', // CRV
          '0x3587b2F7E0E2D6166d6C14230e7Fe160252B0ba4', // COMP
          '0x88128fd4b259552A9A1D457f435a6527AAb72d42', // MKR
          '0x50B728D8D964fd00C2d0AAD81718b71311feF68a', // SNX
          '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3', // BAL
          '0xDA537104D6A5edd53c6fBba9A898708E465260b6', // YFI
        ];
        
        additionalTokens = [...additionalTokens, ...knownSepoliaTokens];
      }
      
      // Combine all token addresses to check
      const allTokenAddresses = [
        ...commonTokens.map(t => t.address),
        ...additionalTokens
      ];
      
      // Remove duplicates
      const uniqueAddresses = [...new Set(allTokenAddresses)];
      
      // Fetch balances for all tokens
      const tokenBalances = await Promise.allSettled(
        uniqueAddresses.map(address => this.getTokenBalance(address))
      );

      // Filter tokens with non-zero balances
      const userTokens = [nativeToken];
      
      tokenBalances.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const token = result.value;
          if (parseFloat(token.balance) > 0) {
            userTokens.push(token);
          }
        }
      });

      return userTokens;
    } catch (error) {
      console.error('Failed to get user tokens:', error);
      return [];
    }
  }

  // Get tokens from user's transaction history
  async getTokensFromHistory() {
    try {
      // Get recent transactions
      const blockNumber = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, blockNumber - 10000); // Last 10k blocks
      
      // Get Transfer events where user is recipient
      const filter = {
        fromBlock: fromBlock,
        toBlock: 'latest',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
          null, // from address (any)
          '0x' + '0'.repeat(24) + this.account.slice(2) // to address (user)
        ]
      };

      const logs = await this.provider.getLogs(filter);
      
      // Extract unique token addresses
      const tokenAddresses = [...new Set(logs.map(log => log.address))];
      
      if (this.debug) {
        console.log(`Found ${tokenAddresses.length} tokens in transaction history`);
      }
      
      return tokenAddresses;
    } catch (error) {
      if (this.debug) {
        console.log('Failed to get tokens from history:', error.message);
      }
      return [];
    }
  }

  // Get tokens from popular DEXes on Sepolia
  async getTokensFromDEXes() {
    if (this.chainId !== 11155111) return []; // Only for Sepolia
    
    try {
      const dexTokens = [];
      
      // Uniswap V2 Factory on Sepolia
      const uniswapFactory = '0x7E0987E5b3a30e3f2828572Bb659A548460a3003';
      
      // Try to get some common token pairs from Uniswap
      const commonPairs = [
        '0x4b96e5b5c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8', // WETH/USDC
        '0x5b96e5b5c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8', // WETH/USDT
        '0x6b96e5b5c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8', // WETH/DAI
      ];
      
      // For now, return empty array as this would require more complex DEX integration
      return dexTokens;
    } catch (error) {
      if (this.debug) {
        console.log('Failed to get tokens from DEXes:', error.message);
      }
      return [];
    }
  }

  // Get native token info (ETH, MATIC, BNB, etc.)
  getNativeTokenInfo(balance) {
    const networkInfo = this.getNetworkInfo();
    return {
      symbol: networkInfo.nativeSymbol,
      name: networkInfo.nativeName,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      logo: networkInfo.nativeLogo,
      balance: ethers.formatEther(balance),
      formattedBalance: this.formatBalance(ethers.formatEther(balance)),
      isNative: true
    };
  }

  // Get token balance for a specific token
  async getTokenBalance(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(this.account)
      ]);

      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      return {
        symbol,
        name,
        address: tokenAddress,
        decimals: Number(decimals),
        logo: this.getTokenLogo(symbol),
        balance: formattedBalance,
        formattedBalance: this.formatBalance(formattedBalance),
        isNative: false
      };
    } catch (error) {
      if (this.debug) {
        console.log(`Failed to get balance for token ${tokenAddress}:`, error.message);
      }
      return null;
    }
  }

  // Get common tokens for the current network
  getCommonTokensForNetwork() {
    const commonTokens = {
      1: [ // Ethereum
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
        { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
        { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
      ],
      137: [ // Polygon
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
        { symbol: 'WMATIC', name: 'Wrapped MATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
      ],
      56: [ // BSC
        { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
        { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
        { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEF2aF8C6b1c6c6c6c6c', decimals: 18 },
      ],
      42161: [ // Arbitrum
        { symbol: 'USDC', name: 'USD Coin', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
        { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
      ],
      11155111: [ // Sepolia - Updated with correct addresses
        { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
        { symbol: 'WETH', name: 'Wrapped Ether', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', decimals: 18 },
        { symbol: 'LINK', name: 'Chainlink', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18 },
        { symbol: 'UNI', name: 'Uniswap', address: '0x1c4b70D8e5C3cE5Aa44DE344d6d69a0ca12b9568', decimals: 18 },
        { symbol: 'USDT', name: 'Tether USD', address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', decimals: 6 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', decimals: 18 },
        // Additional Sepolia tokens
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
        { symbol: 'AAVE', name: 'Aave', address: '0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a', decimals: 18 },
        { symbol: 'CRV', name: 'Curve DAO Token', address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF', decimals: 18 },
        { symbol: 'COMP', name: 'Compound', address: '0x3587b2F7E0E2D6166d6C14230e7Fe160252B0ba4', decimals: 18 },
        { symbol: 'MKR', name: 'Maker', address: '0x88128fd4b259552A9A1D457f435a6527AAb72d42', decimals: 18 },
        { symbol: 'SNX', name: 'Synthetix', address: '0x50B728D8D964fd00C2d0AAD81718b71311feF68a', decimals: 18 },
        { symbol: 'BAL', name: 'Balancer', address: '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3', decimals: 18 },
        { symbol: 'YFI', name: 'yearn.finance', address: '0xDA537104D6A5edd53c6fBba9A898708E465260b6', decimals: 18 },
      ]
    };

    return commonTokens[this.chainId] || [];
  }

  // Get network information
  getNetworkInfo() {
    const networkInfo = {
      1: { nativeSymbol: 'ETH', nativeName: 'Ethereum', nativeLogo: '🔵' },
      137: { nativeSymbol: 'MATIC', nativeName: 'Polygon', nativeLogo: '🟣' },
      56: { nativeSymbol: 'BNB', nativeName: 'BNB', nativeLogo: '🟡' },
      42161: { nativeSymbol: 'ETH', nativeName: 'Ethereum', nativeLogo: '🔵' },
      10: { nativeSymbol: 'ETH', nativeName: 'Ethereum', nativeLogo: '🔵' },
      11155111: { nativeSymbol: 'ETH', nativeName: 'Ethereum', nativeLogo: '🔵' }
    };

    return networkInfo[this.chainId] || { nativeSymbol: 'ETH', nativeName: 'Ethereum', nativeLogo: '🔵' };
  }

  // Get token logo based on symbol
  getTokenLogo(symbol) {
    const logos = {
      'USDC': '🔵',
      'USDT': '🟡',
      'DAI': '🟡',
      'WETH': '🔵',
      'WMATIC': '🟣',
      'WBNB': '🟡',
      'BUSD': '🟡',
      'UNI': '🟣'
    };
    return logos[symbol] || '🪙';
  }

  // Format balance for display
  formatBalance(balance) {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    return (num / 1000000000).toFixed(2) + 'B';
  }
}

// Create and export a singleton instance
const walletTokenService = new WalletTokenService();
export default walletTokenService; 