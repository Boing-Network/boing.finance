// Analytics Service
// Fetches data from external APIs (The Graph, CoinGecko) and aggregates analytics

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const THE_GRAPH_API_BASE = 'https://api.thegraph.com/subgraphs/name';

// Network to subgraph mapping
const SUBGRAPH_MAP = {
  1: 'uniswap/uniswap-v3', // Ethereum
  137: 'uniswap/uniswap-v3-polygon', // Polygon
  56: 'pancakeswap/exchange-v2-bsc', // BSC
  42161: 'uniswap/uniswap-v3-arbitrum', // Arbitrum
  10: 'uniswap/uniswap-v3-optimism', // Optimism
  8453: 'uniswap/uniswap-v3-base', // Base
};

class AnalyticsService {
  constructor(env) {
    this.env = env;
    this.coingeckoApiKey = env.COINGECKO_API_KEY;
    this.theGraphApiKey = env.THE_GRAPH_API_KEY;
    this.theGraphApiToken = env.THE_GRAPH_API_TOKEN;
  }

  // Get CoinGecko API URL with optional API key
  getCoinGeckoUrl(endpoint) {
    const url = `${COINGECKO_API_BASE}${endpoint}`;
    if (this.coingeckoApiKey) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${url}${separator}x_cg_demo_api_key=${this.coingeckoApiKey}`;
    }
    return url;
  }

  // Fetch global market data from CoinGecko
  async getGlobalMarketData() {
    try {
      const response = await fetch(this.getCoinGeckoUrl('/global'));
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching CoinGecko global data:', error);
      return null;
    }
  }

  // Fetch trending tokens from CoinGecko
  async getTrendingTokens() {
    try {
      const response = await fetch(this.getCoinGeckoUrl('/search/trending'));
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching CoinGecko trending:', error);
      return null;
    }
  }

  // Execute GraphQL query to The Graph
  async queryTheGraph(query, variables = {}, network = 1) {
    // Convert chainId to network name if needed
    const chainId = typeof network === 'number' ? network : 1;
    const subgraph = SUBGRAPH_MAP[chainId] || SUBGRAPH_MAP[1];
    const endpoint = `${THE_GRAPH_API_BASE}/${subgraph}`;

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Use API token if available (preferred), otherwise use API key
      if (this.theGraphApiToken) {
        headers['Authorization'] = `Bearer ${this.theGraphApiToken}`;
      } else if (this.theGraphApiKey) {
        headers['X-API-Key'] = this.theGraphApiKey;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        throw new Error(`The Graph API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`The Graph query error: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error(`Error querying The Graph (${network}):`, error);
      return null;
    }
  }

  // Get network statistics from The Graph
  async getNetworkStats(network = 1) {
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

    const data = await this.queryTheGraph(query, {}, network);
    return data?.uniswapFactories?.[0] || null;
  }

  // Get top trading pairs from The Graph
  async getTopTradingPairs(network = 1, limit = 10) {
    const query = `
      query GetTopPairs($limit: Int!) {
        pairs(
          first: $limit
          orderBy: volumeUSD
          orderDirection: desc
        ) {
          id
          token0 {
            id
            symbol
            name
          }
          token1 {
            id
            symbol
            name
          }
          volumeUSD
          reserveUSD
          totalSupply
        }
      }
    `;

    const data = await this.queryTheGraph(query, { limit }, network);
    return data?.pairs || [];
  }

  // Get trending tokens from The Graph
  async getTrendingTokensFromGraph(network = 1, limit = 20) {
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

    const data = await this.queryTheGraph(query, { limit }, network);
    return data?.tokens || [];
  }

  // Aggregate analytics data for a time range
  async getAnalyticsData(range = '24h', networks = [1]) {
    try {
      // Fetch data from multiple sources in parallel
      const [globalMarketData, networkStatsArray, topPairsArray] = await Promise.all([
        this.getGlobalMarketData(),
        Promise.all(networks.map(network => this.getNetworkStats(network))),
        Promise.all(networks.map(network => this.getTopTradingPairs(network, 10)))
      ]);

      // Aggregate network statistics
      const networkStats = {};
      let totalVolume = 0;
      let totalLiquidity = 0;
      let totalPools = 0;
      let totalTransactions = 0;

      networks.forEach((network, index) => {
        const stats = networkStatsArray[index];
        if (stats) {
          const networkName = this.getNetworkName(network);
          networkStats[networkName] = {
            volume: stats.totalVolumeUSD || '0',
            liquidity: stats.totalLiquidityUSD || '0',
            pools: stats.pairCount || 0,
            users: 0, // Would need to track separately
            transactions: stats.txCount || 0
          };

          totalVolume += parseFloat(stats.totalVolumeUSD || 0);
          totalLiquidity += parseFloat(stats.totalLiquidityUSD || 0);
          totalPools += stats.pairCount || 0;
          totalTransactions += stats.txCount || 0;
        }
      });

      // Format top trading pairs
      const topPairs = [];
      networks.forEach((network, index) => {
        const pairs = topPairsArray[index] || [];
        pairs.forEach(pair => {
          topPairs.push({
            token0Symbol: pair.token0?.symbol || 'UNKNOWN',
            token1Symbol: pair.token1?.symbol || 'UNKNOWN',
            network: this.getNetworkName(network),
            volume: pair.volumeUSD || '0',
            liquidity: pair.reserveUSD || '0',
            apy: null // Would need to calculate separately
          });
        });
      });

      // Sort by volume and take top 10
      topPairs.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
      const top10Pairs = topPairs.slice(0, 10);

      return {
        totalVolume: totalVolume.toString(),
        totalLiquidity: totalLiquidity.toString(),
        totalPools,
        totalTransactions,
        networkStats,
        topPairs: top10Pairs,
        marketData: globalMarketData?.data || null,
        timestamp: new Date().toISOString(),
        range
      };
    } catch (error) {
      console.error('Error aggregating analytics data:', error);
      throw error;
    }
  }

  // Helper to get network name
  getNetworkName(chainId) {
    const networkMap = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      11155111: 'Sepolia'
    };
    return networkMap[chainId] || `Chain ${chainId}`;
  }
}

export default AnalyticsService;

