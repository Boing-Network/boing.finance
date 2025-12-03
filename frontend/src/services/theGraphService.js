// The Graph API Service
// Provides efficient, indexed blockchain data queries
// Documentation: https://thegraph.com/docs/en/

class TheGraphService {
  constructor() {
    // The Graph API endpoint
    // Using your API key for authentication
    this.apiKey = process.env.REACT_APP_THE_GRAPH_API_KEY || 'server_b5a9f838aa860fa04075c2527ec8011f';
    this.apiToken = process.env.REACT_APP_THE_GRAPH_API_TOKEN || 'eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDA3MDAxNzcsImp0aSI6ImY4ZDc4NzUzLTkxOTQtNGZmMi1hZjkzLTMzZjE2YThkZGRkOCIsImlhdCI6MTc2NDcwMDE3NywiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbWlkeTk0MDZlZGIxYjMxNDc5NDMiLCJ2IjoyLCJha2kiOiI1NmM3MWNlN2YzNzhhYTExZGZlZTRmNzk0NTZiY2E3Y2M3ZGJiYTBiN2M3MmY0MjZjZTQ3MGI0OTgxMWJhMmU0IiwidWlkIjoiMG1pZHk5NDA2ZWRiMWIzMTQ3OTQzIiwic3Vic3RyZWFtc19wbGFuX3RpZXIiOiJGUkVFIiwiY2ZnIjp7IlNVQlNUUkVBTVNfTUFYX1JFUVVFU1RTIjoiMiIsIlNVQlNUUkVBTVNfUEFSQUxMRUxfSk9CUyI6IjUiLCJTVUJTVFJFQU1TX1BBUkFMTEVMX1dPUktFUlMiOiI1In0sInRva2VuX2FwaV9wbGFuX3RpZXIiOiJGUkVFIiwidG9rZW5fYXBpX2ZlYXR1cmVfY29uZmlncyI6eyJUT0tFTl9BUElfQkFUQ0hfU0laRSI6IjEiLCJUT0tFTl9BUElfSVRFTVNfUkVUVVJORUQiOiIxMCIsIlRPS0VOX0FQSV9NQVhJTVVNX0FMTE9XRURfRU5EUE9JTlRfR1JPVVAiOiJuZnQiLCJUT0tFTl9BUElfUExBTl9DUkVESVRTX0NFTlRTIjoiMjUwMCIsIlRPS0VOX0FQSV9SQVRFX0xJTUlUX1BFUl9NSU5VVEUiOiIyMDAiLCJUT0tFTl9BUElfUkVBTF9USU1FX0RBVEEiOiJ0cnVlIn19.hanOsf8qIdXaFPDqyFeMb-jM2T2lkogUSAHyTpk7SOmjr9YruhCN5NaD_m-YdV57ALSBfqckVY6t7vA-V3MNEA';
    
    // The Graph API base URL
    // Using dfuse.io endpoint (based on your token)
    this.baseUrl = 'https://api.dfuse.io/v1/graphql';
    
    // Cache for query results
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    
    // Network to subgraph mapping
    this.subgraphMap = {
      1: 'uniswap/uniswap-v3', // Ethereum - Uniswap V3
      137: 'uniswap/uniswap-v3-polygon', // Polygon
      56: 'pancakeswap/exchange-v2-bsc', // BSC - PancakeSwap
      42161: 'uniswap/uniswap-v3-arbitrum', // Arbitrum
      10: 'uniswap/uniswap-v3-optimism', // Optimism
      8453: 'uniswap/uniswap-v3-base', // Base
      11155111: 'uniswap/uniswap-v3-sepolia' // Sepolia (if available)
    };
  }

  // Get GraphQL endpoint for a network
  getEndpoint(network = 'ethereum') {
    // Use The Graph Gateway with API key for authenticated requests
    // This avoids CSP issues and provides better rate limits
    const apiKey = this.apiKey;
    
    // If API key is available, use the gateway
    if (apiKey && apiKey !== 'server_b5a9f838aa860fa04075c2527ec8011f') {
      // Use gateway URL format: https://gateway-<network>.network.thegraph.com/api/<apiKey>/subgraphs/id/<subgraphId>
      // For now, fallback to public subgraphs if gateway not configured
      const networkMap = {
        ethereum: `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`,
        polygon: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
        'binance-smart-chain': 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2-bsc',
        arbitrum: `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`,
        optimism: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism',
        base: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base'
      };
      return networkMap[network] || networkMap.ethereum;
    }
    
    // Fallback to public subgraphs (may be blocked by CSP)
    const networkMap = {
      ethereum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      polygon: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
      'binance-smart-chain': 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2-bsc',
      arbitrum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum',
      optimism: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism',
      base: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base'
    };
    
    return networkMap[network] || networkMap.ethereum;
  }

  // Execute GraphQL query
  async query(query, variables = {}, network = 'ethereum') {
    const cacheKey = `${network}_${JSON.stringify({ query, variables })}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const endpoint = this.getEndpoint(network);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` }),
          ...(this.apiKey && { 'X-API-Key': this.apiKey })
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.errors) {
        return null;
      }

      this.cache.set(cacheKey, { data: data.data, timestamp: Date.now() });
      return data.data;
    } catch (error) {
      // Silently handle CSP violations and network errors
      return null;
    }
  }

  // Get pool data for a token pair
  async getPoolData(token0Address, token1Address, network = 'ethereum') {
    const query = `
      query GetPool($token0: String!, $token1: String!) {
        pools(
          where: {
            token0: $token0,
            token1: $token1
          }
          orderBy: totalValueLockedUSD
          orderDirection: desc
          first: 1
        ) {
          id
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
          liquidity
          totalValueLockedUSD
          volumeUSD
          txCount
          feeTier
        }
      }
    `;

    return await this.query(query, {
      token0: token0Address.toLowerCase(),
      token1: token1Address.toLowerCase()
    }, network);
  }

  // Get token price from pools
  async getTokenPrice(tokenAddress, network = 'ethereum') {
    const query = `
      query GetTokenPrice($tokenAddress: String!) {
        token(id: $tokenAddress) {
          id
          symbol
          name
          decimals
          derivedETH
          totalValueLocked
          txCount
          poolCount
        }
      }
    `;

    return await this.query(query, {
      tokenAddress: tokenAddress.toLowerCase()
    }, network);
  }

  // Get user's liquidity positions
  async getUserPositions(userAddress, network = 'ethereum') {
    const query = `
      query GetUserPositions($userAddress: String!) {
        positions(
          where: {
            owner: $userAddress
          }
          first: 100
        ) {
          id
          owner
          pool {
            id
            token0 {
              symbol
              name
            }
            token1 {
              symbol
              name
            }
            totalValueLockedUSD
          }
          liquidity
          depositedToken0
          depositedToken1
        }
      }
    `;

    return await this.query(query, {
      userAddress: userAddress.toLowerCase()
    }, network);
  }

  // Get token transactions
  async getTokenTransactions(tokenAddress, network = 'ethereum', limit = 10) {
    const query = `
      query GetTokenTransactions($tokenAddress: String!, $limit: Int!) {
        swaps(
          where: {
            token0: $tokenAddress
          }
          orderBy: timestamp
          orderDirection: desc
          first: $limit
        ) {
          id
          timestamp
          amount0
          amount1
          amountUSD
          sender
          recipient
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
    `;

    return await this.query(query, {
      tokenAddress: tokenAddress.toLowerCase(),
      limit
    }, network);
  }

  // Get pool analytics
  async getPoolAnalytics(poolAddress, network = 'ethereum') {
    const query = `
      query GetPoolAnalytics($poolAddress: String!) {
        pool(id: $poolAddress) {
          id
          totalValueLockedUSD
          volumeUSD
          volume24hUSD
          txCount
          feeTier
          token0 {
            symbol
            priceUSD
          }
          token1 {
            symbol
            priceUSD
          }
          liquidity
          createdAtTimestamp
        }
      }
    `;

    return await this.query(query, {
      poolAddress: poolAddress.toLowerCase()
    }, network);
  }

  // Get trending tokens by volume
  async getTrendingTokens(network = 'ethereum', limit = 20) {
    const query = `
      query GetTrendingTokens($limit: Int!) {
        tokens(
          orderBy: volumeUSD
          orderDirection: desc
          first: $limit
        ) {
          id
          symbol
          name
          volumeUSD
          totalValueLocked
          priceUSD
          priceChange24h
        }
      }
    `;

    return await this.query(query, { limit }, network);
  }

  // Get network statistics
  async getNetworkStats(network = 'ethereum') {
    const query = `
      query GetNetworkStats {
        uniswapFactories(first: 1) {
          totalVolumeUSD
          totalLiquidityUSD
          txCount
          pairCount
        }
      }
    `;

    return await this.query(query, {}, network);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const theGraphService = new TheGraphService();
export default theGraphService;

