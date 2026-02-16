// Portfolio Service
// Tracks wallet balances across multiple networks with CoinGecko price integration
// Enhanced with The Graph and Alchemy APIs for better performance

import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';
import coingeckoService from './coingeckoService';
import theGraphService from './theGraphService';
import alchemyService from './alchemyService';

class PortfolioService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // Get provider for a network
  getProvider(chainId) {
    const network = NETWORKS[chainId];
    if (!network) return null;
    return new ethers.JsonRpcProvider(network.rpcUrl);
  }

  // Get native token balance (ETH, MATIC, BNB, etc.)
  async getNativeBalance(address, chainId) {
    try {
      const provider = this.getProvider(chainId);
      if (!provider) return null;

      const balance = await provider.getBalance(address);
      const network = NETWORKS[chainId];
      
      return {
        address: 'native',
        symbol: network?.nativeCurrency?.symbol || 'ETH',
        name: network?.nativeCurrency?.name || 'Ethereum',
        balance: ethers.formatEther(balance),
        balanceRaw: balance.toString(),
        decimals: 18,
        chainId,
        isNative: true
      };
    } catch (error) {
      console.error(`Error fetching native balance for chain ${chainId}:`, error);
      return null;
    }
  }

  // Get ERC20 token balance
  async getTokenBalance(address, tokenAddress, chainId) {
    try {
      const provider = this.getProvider(chainId);
      if (!provider) return null;

      const ERC20_ABI = [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function name() view returns (string)'
      ];

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [balance, decimals, symbol, name] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name()
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        balance: ethers.formatUnits(balance, decimals),
        balanceRaw: balance.toString(),
        decimals,
        chainId,
        isNative: false
      };
    } catch (error) {
      console.error(`Error fetching token balance:`, error);
      return null;
    }
  }

  // Get token price from CoinGecko (with The Graph fallback for DEX tokens)
  async getTokenPrice(token, chainId) {
    const cacheKey = `price_${chainId}_${token.address}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const networkMap = {
        1: 'ethereum',
        137: 'polygon',
        56: 'binance-smart-chain',
        42161: 'arbitrum',
        10: 'optimistic-ethereum',
        8453: 'base',
        11155111: 'ethereum'
      };

      const cgNetwork = networkMap[chainId] || 'ethereum';
      
      // For native tokens, use coin ID endpoint
      if (token.isNative) {
        const nativeMap = {
          1: 'ethereum',
          137: 'matic-network',
          56: 'binancecoin',
          42161: 'ethereum',
          10: 'ethereum',
          8453: 'ethereum',
          11155111: 'ethereum'
        };
        const coinId = nativeMap[chainId] || 'ethereum';
        const priceData = await coingeckoService.getCoinPrice(coinId);
        if (priceData) {
          this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
          return priceData;
        }
      } else {
        // Try CoinGecko first
        const priceData = await coingeckoService.getTokenPrice(token.address, cgNetwork);
        if (priceData) {
          this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
          return priceData;
        }

        // Fallback to The Graph for DEX tokens (if available)
        try {
          const graphData = await theGraphService.getTokenPrice(token.address, cgNetwork);
          if (graphData && graphData.token) {
            // Convert derivedETH to USD (approximate, would need ETH price)
            const ethPrice = await coingeckoService.getCoinPrice('ethereum');
            if (ethPrice && graphData.token.derivedETH) {
              const usdPrice = parseFloat(graphData.token.derivedETH) * (ethPrice.usd || 0);
              const priceData = {
                usd: usdPrice,
                usd_24h_change: 0 // The Graph doesn't provide 24h change directly
              };
              this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
              return priceData;
            }
          }
        } catch (graphError) {
          console.warn('The Graph price lookup failed:', graphError);
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  // Get all token balances for an address on a network
  // Enhanced with Alchemy API for better performance
  async getNetworkBalances(address, chainId, tokenAddresses = []) {
    try {
      const balances = [];

      // Get native balance (try Alchemy first, fallback to standard RPC)
      const nativeBalance = await this.getNativeBalance(address, chainId);
      if (nativeBalance) {
        balances.push(nativeBalance);
      }

      // Try Alchemy API for token balances (faster and more reliable)
      try {
        const alchemyBalances = await alchemyService.getTokenBalances(chainId, address);
        if (alchemyBalances && alchemyBalances.tokenBalances) {
          for (const tokenBalance of alchemyBalances.tokenBalances) {
            if (tokenBalance.contractAddress && tokenBalance.tokenBalance !== '0x0') {
              // Get token metadata from Alchemy
              const metadata = await alchemyService.getTokenMetadata(chainId, tokenBalance.contractAddress);
              if (metadata) {
                const balance = BigInt(tokenBalance.tokenBalance);
                balances.push({
                  address: tokenBalance.contractAddress,
                  symbol: metadata.symbol || 'UNKNOWN',
                  name: metadata.name || 'Unknown Token',
                  balance: ethers.formatUnits(balance, metadata.decimals || 18),
                  balanceRaw: balance.toString(),
                  decimals: metadata.decimals || 18,
                  chainId,
                  isNative: false
                });
              }
            }
          }
        }
      } catch (alchemyError) {
        console.warn('Alchemy API failed, falling back to standard RPC:', alchemyError);
        // Fallback to standard method
        for (const tokenAddress of tokenAddresses) {
          const tokenBalance = await this.getTokenBalance(address, tokenAddress, chainId);
          if (tokenBalance && parseFloat(tokenBalance.balance) > 0) {
            balances.push(tokenBalance);
          }
        }
      }

      return balances;
    } catch (error) {
      console.error(`Error fetching network balances:`, error);
      return [];
    }
  }

  // Get liquidity positions from The Graph (for DEX pools)
  async getLiquidityPositions(address, chainId) {
    try {
      const networkMap = {
        1: 'ethereum',
        137: 'polygon',
        56: 'binance-smart-chain',
        42161: 'arbitrum',
        10: 'optimism',
        8453: 'base',
        11155111: 'ethereum'
      };

      const network = networkMap[chainId] || 'ethereum';
      const positions = await theGraphService.getUserPositions(address, network);
      
      if (positions && positions.positions) {
        return positions.positions.map(pos => ({
          id: pos.id,
          pool: pos.pool,
          liquidity: pos.liquidity,
          token0: pos.depositedToken0,
          token1: pos.depositedToken1,
          chainId
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching liquidity positions:', error);
      return [];
    }
  }

  // Get portfolio value with prices
  async getPortfolioValue(balances) {
    let totalValue = 0;
    const balancesWithPrices = [];

    for (const balance of balances) {
      const priceData = await this.getTokenPrice(balance, balance.chainId);
      const price = priceData?.usd || 0;
      const value = parseFloat(balance.balance) * price;
      
      balancesWithPrices.push({
        ...balance,
        price,
        value,
        priceChange24h: priceData?.usd_24h_change || 0
      });

      totalValue += value;
    }

    return {
      totalValue,
      balances: balancesWithPrices,
      timestamp: Date.now()
    };
  }

  // Get portfolio across multiple networks
  async getMultiNetworkPortfolio(address, chainIds, tokenAddressesByChain = {}) {
    const allBalances = [];

    for (const chainId of chainIds) {
      try {
        const tokenAddresses = tokenAddressesByChain[chainId] || [];
        const balances = await this.getNetworkBalances(address, chainId, tokenAddresses);
        allBalances.push(...balances);
      } catch (error) {
        console.error(`Error fetching balances for chain ${chainId}:`, error);
      }
    }

    return await this.getPortfolioValue(allBalances);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

const portfolioServiceInstance = new PortfolioService();
export default portfolioServiceInstance;

