import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';

// Basic ERC-20 ABI for token validation
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// DEX Factory ABI for pair scanning
const FACTORY_ABI = [
  'function allPairs(uint256) view returns (address)',
  'function allPairsLength() view returns (uint256)',
  'function getPair(address, address) view returns (address)',
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)'
];

// DEX Pair ABI for liquidity data
const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() view returns (uint256)',
  'function factory() view returns (address)'
];

// Token scanner service for monitoring blockchain events
export class TokenScanner {
  constructor(provider, network) {
    this.provider = provider;
    this.network = network;
    this.providers = new Map();
    this.isScanning = false;
    this.scanInterval = null;
    this.lastScannedBlock = 0;
    this.eventCallbacks = new Map();
  }

  // Get provider for a specific chain
  getProvider(chainId) {
    if (this.providers.has(chainId)) {
      return this.providers.get(chainId);
    }

    // NETWORKS is an object, not an array, so we access it directly
    const network = NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    this.providers.set(chainId, provider);
    return provider;
  }

  // Validate if an address is a valid ERC-20 token
  async validateToken(tokenAddress, chainId) {
    try {
      const provider = this.getProvider(chainId);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      // Check if contract exists and has basic ERC-20 functions
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);

      // Basic validation
      if (!name || !symbol || totalSupply === 0n) {
        return null;
      }

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        chainId,
        isValid: true
      };
    } catch (error) {
      console.log(`Token validation failed for ${tokenAddress}:`, error.message);
      return null;
    }
  }

  // Scan recent blocks for token creation events
  async scanRecentBlocks(chainId, maxBlocks = 5) {
    try {
      const provider = this.getProvider(chainId);
      if (!provider) {
        console.error('No provider available for chainId:', chainId);
        return [];
      }

      const currentBlock = await this.makeRateLimitedRequest(provider, 'eth_blockNumber', []);
      const latestBlock = parseInt(currentBlock, 16);
      const fromBlock = Math.max(0, latestBlock - maxBlocks);
      
      console.log(`Scanning blocks ${fromBlock}-${latestBlock} on chain ${chainId}`);

      // Scan for Transfer events from zero address (token creation)
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const zeroAddressTopic = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Use smaller block ranges to avoid hitting the 10,000 result limit
      const allLogs = [];
      const blockRangeSize = 1; // Scan 1 block at a time to reduce load
      
      for (let block = fromBlock; block <= latestBlock; block += blockRangeSize) {
        const endBlock = Math.min(block + blockRangeSize - 1, latestBlock);
        
        try {
          const logs = await this.makeRateLimitedRequest(provider, 'eth_getLogs', [{
            fromBlock: '0x' + block.toString(16),
            toBlock: '0x' + endBlock.toString(16),
            topics: [transferTopic, zeroAddressTopic]
          }]);
          
          if (logs && logs.length > 0) {
            allLogs.push(...logs);
          }
          
          // Reduced delay between block range requests
          if (block + blockRangeSize <= latestBlock) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Reduced to 200ms
          }
        } catch (error) {
          console.warn(`Error scanning blocks ${block}-${endBlock}:`, error.message);
          // Continue with next block range
          continue;
        }
      }

      if (allLogs.length === 0) {
        console.log('No transfer events found in recent blocks');
        return [];
      }

      // Group by token address and get unique tokens
      const tokenAddresses = [...new Set(allLogs.map(log => log.address.toLowerCase()))];
      console.log(`Found ${tokenAddresses.length} unique token addresses`);

      // Process first 10 tokens with faster processing
      const limitedTokenAddresses = tokenAddresses.slice(0, 10);
      console.log(`Processing first ${limitedTokenAddresses.length} tokens with optimized speed`);

      // Get token details with optimized rate limiting
      const tokens = [];
      for (let i = 0; i < limitedTokenAddresses.length; i++) {
        const address = limitedTokenAddresses[i];
        
        // Reduced delay between token requests
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Reduced to 300ms
        }
        
        try {
          const token = await this.getTokenDetails(address, chainId);
          if (token) {
            tokens.push(token);
            console.log(`Processed token ${i + 1}/${limitedTokenAddresses.length}: ${token.name} (${token.symbol})`);
          }
        } catch (error) {
          console.warn(`Error getting details for token ${address}:`, error.message);
          continue;
        }
      }

      console.log(`Successfully processed ${tokens.length} tokens`);
      return tokens;
    } catch (error) {
      console.error('Error scanning blocks:', error);
      return [];
    }
  }

  // Scan DEX factory for new pairs
  async scanDEXFactory(factoryAddress, chainId, _hoursBack = 24) {
    try {
      const provider = this.getProvider(chainId);
      const factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

      // Get total pairs
      const pairCount = await factoryContract.allPairsLength();
      console.log(`Found ${pairCount} pairs in factory ${factoryAddress}`);

      const newTokens = new Set();

      // Scan recent pairs
      const startIndex = Math.max(0, pairCount - 50); // Last 50 pairs
      
      for (let i = startIndex; i < pairCount; i++) {
        try {
          const pairAddress = await factoryContract.allPairs(i);
          const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);

          // Get tokens in the pair
          const [token0, token1] = await Promise.all([
            pairContract.token0(),
            pairContract.token1()
          ]);

          newTokens.add(token0);
          newTokens.add(token1);
        } catch (error) {
          console.error(`Error scanning pair ${i}:`, error.message);
        }
      }

      return Array.from(newTokens);
    } catch (error) {
      console.error('Error scanning DEX factory:', error);
      return [];
    }
  }

  // Get token metadata and metrics
  async getTokenMetadata(tokenAddress, chainId) {
    try {
      const provider = this.getProvider(chainId);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      // Get basic token info
      const [name, symbol, decimals, totalSupply, owner] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
        tokenContract.owner().catch(() => ethers.ZeroAddress)
      ]);

      // Calculate basic metrics
      const totalSupplyFormatted = parseFloat(ethers.formatUnits(totalSupply, decimals));
      
      // Estimate market cap (placeholder - would need price feed)
      const estimatedPrice = 0.001; // Placeholder
      const marketCap = totalSupplyFormatted * estimatedPrice;

      // Get deployment info
      const deploymentBlock = await this.getDeploymentBlock(tokenAddress, chainId);
      const deploymentTime = deploymentBlock ? await this.getBlockTimestamp(deploymentBlock, chainId) : null;

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        totalSupplyFormatted,
        owner,
        chainId,
        marketCap,
        estimatedPrice,
        deploymentBlock,
        deploymentTime,
        age: deploymentTime ? this.calculateAge(deploymentTime) : null,
        isValid: true
      };
    } catch (error) {
      console.error(`Error getting metadata for ${tokenAddress}:`, error);
      return null;
    }
  }

  // Get deployment block for a contract
  async getDeploymentBlock(contractAddress, chainId) {
    try {
      const provider = this.getProvider(chainId);
      const code = await provider.getCode(contractAddress);
      
      if (code === '0x') {
        return null; // Contract doesn't exist
      }

      // Binary search for deployment block
      let currentBlock = await provider.getBlockNumber();
      let left = 0;
      let right = currentBlock;
      let deploymentBlock = null;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        try {
          const codeAtMid = await provider.getCode(contractAddress, mid);
          if (codeAtMid === '0x') {
            left = mid + 1;
          } else {
            deploymentBlock = mid;
            right = mid - 1;
          }
        } catch (error) {
          right = mid - 1;
        }
      }

      return deploymentBlock;
    } catch (error) {
      console.error(`Error getting deployment block for ${contractAddress}:`, error);
      return null;
    }
  }

  // Get block timestamp
  async getBlockTimestamp(blockNumber, chainId) {
    try {
      const provider = this.getProvider(chainId);
      const block = await provider.getBlock(blockNumber);
      return block ? block.timestamp : null;
    } catch (error) {
      console.error(`Error getting block timestamp for ${blockNumber}:`, error);
      return null;
    }
  }

  // Calculate age from timestamp
  calculateAge(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const ageInSeconds = now - timestamp;
    
    if (ageInSeconds < 3600) {
      return `${Math.floor(ageInSeconds / 60)} minutes`;
    } else if (ageInSeconds < 86400) {
      return `${Math.floor(ageInSeconds / 3600)} hours`;
    } else {
      return `${Math.floor(ageInSeconds / 86400)} days`;
    }
  }

  // Main function to get recently deployed tokens
  async getRecentlyDeployedTokens(chainId, hoursBack = 24) {
    const cacheKey = `recent_tokens_${chainId}_${hoursBack}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      console.log(`Scanning for recently deployed tokens on chain ${chainId} (last ${hoursBack} hours)`);

      // 1. Scan recent blocks for token creation
      const blockTokens = await this.scanRecentBlocks(chainId, hoursBack);
      console.log(`Found ${blockTokens.length} potential tokens from block scanning`);
      
      // 2. For now, skip DEX factory scanning until we have actual factory addresses
      // const factoryTokens = await this.scanDEXFactory('0x...', chainId, hoursBack);
      const factoryTokens = [];
      
      // 3. Combine and deduplicate
      const allTokenAddresses = new Set([...blockTokens, ...factoryTokens]);
      console.log(`Total unique token addresses found: ${allTokenAddresses.size}`);
      
      // 4. Validate and get metadata (limit to first 20 for performance)
      const validatedTokens = [];
      const addressesToValidate = Array.from(allTokenAddresses).slice(0, 20);
      
      for (const address of addressesToValidate) {
        try {
          const metadata = await this.getTokenMetadata(address, chainId);
          if (metadata && metadata.isValid) {
            validatedTokens.push(metadata);
            console.log(`Validated token: ${metadata.name} (${metadata.symbol})`);
          }
        } catch (error) {
          console.log(`Failed to validate token ${address}:`, error.message);
        }
      }

      // 5. Sort by deployment time (newest first)
      const sortedTokens = validatedTokens.sort((a, b) => {
        if (!a.deploymentTime || !b.deploymentTime) return 0;
        return b.deploymentTime - a.deploymentTime;
      });

      // 6. Cache results
      this.cache.set(cacheKey, {
        data: sortedTokens,
        timestamp: Date.now()
      });

      console.log(`Successfully validated ${sortedTokens.length} recently deployed tokens on chain ${chainId}`);
      return sortedTokens;

    } catch (error) {
      console.error('Error getting recently deployed tokens:', error);
      return [];
    }
  }

  // Get trending tokens based on on-chain activity
  async getTrendingTokens(chainId, hoursBack = 24) {
    try {
      const tokens = await this.getRecentlyDeployedTokens(chainId, hoursBack);
      
      // Calculate trending metrics (placeholder - would need more sophisticated analysis)
      const trendingTokens = tokens.map(token => ({
        ...token,
        trendingScore: this.calculateTrendingScore(token.totalSupplyFormatted, token.decimals),
        volume24h: token.marketCap * 0.05, // Placeholder
        priceChange24h: (Math.random() - 0.5) * 20, // Placeholder
        holderCount: Math.floor(Math.random() * 1000) + 10 // Placeholder
      }));

      // Sort by trending score
      return trendingTokens.sort((a, b) => b.trendingScore - a.trendingScore);
    } catch (error) {
      console.error('Error getting trending tokens:', error);
      return [];
    }
  }

  // Calculate trending score (placeholder implementation)
  calculateTrendingScore(totalSupply, decimals) {
    try {
      // Convert totalSupply to a number and handle BigInt
      let supplyValue;
      if (typeof totalSupply === 'bigint') {
        supplyValue = Number(totalSupply);
      } else if (typeof totalSupply === 'string') {
        supplyValue = parseFloat(totalSupply);
      } else {
        supplyValue = Number(totalSupply);
      }

      // Handle invalid values
      if (isNaN(supplyValue) || supplyValue <= 0) {
        return 0;
      }

      // Convert to human-readable format
      const formattedSupply = supplyValue / Math.pow(10, decimals || 18);
      
      // Calculate trending score based on supply size
      // Lower supply = higher score (rarer tokens)
      let score = 0;
      
      if (formattedSupply < 1000000) {
        score = 95; // Very rare
      } else if (formattedSupply < 10000000) {
        score = 85; // Rare
      } else if (formattedSupply < 100000000) {
        score = 75; // Uncommon
      } else if (formattedSupply < 1000000000) {
        score = 65; // Common
      } else if (formattedSupply < 10000000000) {
        score = 55; // Very common
      } else {
        score = 45; // Extremely common
      }

      // Add some randomness to make it more interesting
      const randomFactor = Math.random() * 10;
      score = Math.round(score + randomFactor);

      // Ensure score is between 0 and 100
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating trending score:', error);
      return 50; // Default score
    }
  }

  // Rate-limited request helper with exponential backoff
  async makeRateLimitedRequest(provider, method, params) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await provider.send(method, params);
      } catch (error) {
        if (error.code === -32005 || error.message.includes('Too Many Requests') || error.status === 429) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Rate limit hit, waiting ${backoffDelay}ms before retry ${attempt + 1}/${this.maxRetries + 1}...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded for rate-limited request');
  }

  async getTokenDetails(address, chainId) {
    try {
      const provider = this.getProvider(chainId);
      if (!provider) {
        console.error('No provider available for chainId:', chainId);
        return null;
      }

      // Check cache first
      const cacheKey = `${address}-${chainId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const tokenAddress = address.toLowerCase();
      
      // Create contract interface for ERC20
      const _abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)',
        'function owner() view returns (address)',
        'function getOwner() view returns (address)'
      ];

      // const contract = new ethers.Contract(tokenAddress, abi, provider);

      // Get basic token info with optimized batch requests
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.makeRateLimitedRequest(provider, 'eth_call', [{
          to: tokenAddress,
          data: '0x06fdde03' // name()
        }, 'latest']).then(result => {
          try {
            return ethers.AbiCoder.defaultAbiCoder().decode(['string'], result)[0];
          } catch {
            return 'Unknown';
          }
        }),
        this.makeRateLimitedRequest(provider, 'eth_call', [{
          to: tokenAddress,
          data: '0x95d89b41' // symbol()
        }, 'latest']).then(result => {
          try {
            return ethers.AbiCoder.defaultAbiCoder().decode(['string'], result)[0];
          } catch {
            return 'UNKNOWN';
          }
        }),
        this.makeRateLimitedRequest(provider, 'eth_call', [{
          to: tokenAddress,
          data: '0x313ce567' // decimals()
        }, 'latest']).then(result => {
          try {
            return parseInt(ethers.AbiCoder.defaultAbiCoder().decode(['uint8'], result)[0]);
          } catch {
            return 18;
          }
        }),
        this.makeRateLimitedRequest(provider, 'eth_call', [{
          to: tokenAddress,
          data: '0x18160ddd' // totalSupply()
        }, 'latest']).then(result => {
          try {
            return ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result)[0];
          } catch {
            return ethers.parseUnits('0', 18);
          }
        })
      ]);

      // Validate token
      if (!name || name === 'Unknown' || !symbol || symbol === 'UNKNOWN') {
        return null;
      }

      // Skip owner lookup to save time (optional optimization)
      let owner = null;
      // Uncomment below if you want owner information (adds ~200ms per token)
      /*
      try {
        const ownerResult = await this.makeRateLimitedRequest(provider, 'eth_call', [{
          to: tokenAddress,
          data: '0x8da5cb5b' // owner()
        }, 'latest']);
        if (ownerResult && ownerResult !== '0x') {
          owner = ethers.AbiCoder.defaultAbiCoder().decode(['address'], ownerResult)[0];
        }
      } catch (error) {
        // Owner function might not exist, try getOwner
        try {
          const getOwnerResult = await this.makeRateLimitedRequest(provider, 'eth_call', [{
            to: tokenAddress,
            data: '0x893d20e8' // getOwner()
          }, 'latest']);
          if (getOwnerResult && getOwnerResult !== '0x') {
            owner = ethers.AbiCoder.defaultAbiCoder().decode(['address'], getOwnerResult)[0];
          }
        } catch {
          // No owner function available - skip to save time
        }
      }
      */

      const token = {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        owner,
        chainId,
        trendingScore: this.calculateTrendingScore(totalSupply, decimals),
        price: 0, // Skip price calculation for now to save time
        volume24h: '0',
        marketCap: '0'
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: token,
        timestamp: Date.now()
      });

      return token;
    } catch (error) {
      console.error(`Error getting token details for ${address}:`, error);
      return null;
    }
  }

  async getTokenPrice(address, chainId) {
    try {
      const provider = this.getProvider(chainId);
      if (!provider) {
        return 0;
      }

      // For now, return a placeholder price
      // In a real implementation, you would query DEX pairs or price oracles
      return 0;
    } catch (error) {
      console.error(`Error getting price for token ${address}:`, error);
      return 0;
    }
  }

  // Search for a specific token by address
  async searchToken(address, chainId) {
    try {
      const provider = this.getProvider(chainId);
      if (!provider) {
        console.error('No provider available for chainId:', chainId);
        return null;
      }

      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid token address format');
      }

      console.log(`Searching for token: ${address} on chain ${chainId}`);
      const token = await this.getTokenDetails(address, chainId);
      
      if (token) {
        console.log(`Found token: ${token.name} (${token.symbol})`);
        return token;
      } else {
        console.log('Token not found or invalid');
        return null;
      }
    } catch (error) {
      console.error('Error searching token:', error);
      throw error;
    }
  }
}

export default TokenScanner; 