// Analytics Service
// Fetches data from external APIs (The Graph, CoinGecko) and aggregates analytics

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const THE_GRAPH_API_BASE = 'https://api.thegraph.com/subgraphs/name';

// Network to subgraph mapping (The Graph - many hosted endpoints deprecated)
const SUBGRAPH_MAP = {
  1: 'uniswap/uniswap-v3', // Ethereum
  137: 'uniswap/uniswap-v3-polygon', // Polygon
  56: 'pancakeswap/exchange-v2-bsc', // BSC
  42161: 'uniswap/uniswap-v3-arbitrum', // Arbitrum
  10: 'uniswap/uniswap-v3-optimism', // Optimism
  8453: 'uniswap/uniswap-v3-base', // Base
};

// DefiLlama chain id to our chainId
const DEFILLAMA_TO_CHAIN = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  arbitrum: 42161,
  optimism: 10,
  'op mainnet': 10,
  base: 8453,
  solana: 0, // not EVM
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

  // Fetch DEX overview from DefiLlama (reliable fallback when The Graph fails)
  async getDefiLlamaDexData() {
    try {
      const response = await fetch(
        'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true',
        { signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('DefiLlama API error:', error.message);
      return null;
    }
  }

  // Build network stats and top pairs from DefiLlama breakdown
  buildFromDefiLlama(llamaData, networks) {
    const networkStats = {};
    const pairVolumeMap = {}; // "ETH/USDC|Ethereum" -> volume

    if (!llamaData?.protocols?.length) return { networkStats: {}, topPairs: [] };

    for (const proto of llamaData.protocols) {
      const breakdown = proto.breakdown24h || proto.breakdown30d;
      if (!breakdown || typeof breakdown !== 'object') continue;

      for (const [chainKey, pairs] of Object.entries(breakdown)) {
        const chainId = DEFILLAMA_TO_CHAIN[chainKey.toLowerCase()];
        if (chainId === 0 || (networks.length > 0 && !networks.includes(chainId))) continue;

        const networkName = this.getNetworkName(chainId);
        if (!networkStats[networkName]) {
          networkStats[networkName] = { volume: 0, liquidity: 0, pools: 0, users: 0, transactions: 0 };
        }

        let chainVol = 0;
        const pairData = typeof pairs === 'object' ? pairs : {};
        for (const [dexName, vol] of Object.entries(pairData)) {
          const v = typeof vol === 'number' ? vol : parseFloat(vol) || 0;
          chainVol += v;
          const pairKey = `${dexName}|${networkName}`;
          pairVolumeMap[pairKey] = (pairVolumeMap[pairKey] || 0) + v;
        }
        const prev = parseFloat(networkStats[networkName].volume) || 0;
        networkStats[networkName].volume = (prev + chainVol).toString();
      }
    }

    // Top pairs as protocol/chain combinations (DEX name + network)
    const topPairs = Object.entries(pairVolumeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([key, volume]) => {
        const [dexName, network] = key.split('|');
        return {
          token0Symbol: dexName || 'DEX',
          token1Symbol: 'Volume',
          network: network || 'Unknown',
          volume: Math.round(volume).toString(),
          liquidity: '0',
          apy: null
        };
      });

    return { networkStats, topPairs };
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
      const defaultNetworks = [1, 137, 56, 42161, 10, 8453];
      const targetNetworks = networks.length > 0 ? networks : defaultNetworks;

      // Fetch CoinGecko + DefiLlama in parallel (DefiLlama is reliable fallback)
      const [globalMarketData, graphStats, llamaData] = await Promise.all([
        this.getGlobalMarketData(),
        Promise.all([
          Promise.all(targetNetworks.map(n => this.getNetworkStats(n))),
          Promise.all(targetNetworks.map(n => this.getTopTradingPairs(n, 10)))
        ]).then(([networkStatsArray, topPairsArray]) => ({ networkStatsArray, topPairsArray })),
        this.getDefiLlamaDexData()
      ]);

      const [networkStatsArray, topPairsArray] = [graphStats.networkStatsArray, graphStats.topPairsArray];
      let networkStats = {};
      let totalVolume = 0;
      let totalLiquidity = 0;
      let totalPools = 0;
      let totalTransactions = 0;
      let topPairs = [];

      // Try The Graph first
      targetNetworks.forEach((network, index) => {
        const stats = networkStatsArray[index];
        if (stats) {
          const networkName = this.getNetworkName(network);
          networkStats[networkName] = {
            volume: stats.totalVolumeUSD || '0',
            liquidity: stats.totalLiquidityUSD || '0',
            pools: stats.pairCount || 0,
            users: 0,
            transactions: stats.txCount || 0
          };
          totalVolume += parseFloat(stats.totalVolumeUSD || 0);
          totalLiquidity += parseFloat(stats.totalLiquidityUSD || 0);
          totalPools += stats.pairCount || 0;
          totalTransactions += stats.txCount || 0;
        }
      });

      targetNetworks.forEach((network, index) => {
        const pairs = topPairsArray[index] || [];
        pairs.forEach(pair => {
          topPairs.push({
            token0Symbol: pair.token0?.symbol || 'UNKNOWN',
            token1Symbol: pair.token1?.symbol || 'UNKNOWN',
            network: this.getNetworkName(network),
            volume: pair.volumeUSD || '0',
            liquidity: pair.reserveUSD || '0',
            apy: null
          });
        });
      });

      // Fallback: use DefiLlama when The Graph returns no network stats or no top pairs
      const hasGraphData = Object.keys(networkStats).length > 0 && topPairs.length > 0;
      if (!hasGraphData && llamaData) {
        const built = this.buildFromDefiLlama(llamaData, targetNetworks);
        if (Object.keys(built.networkStats).length > 0) {
          networkStats = built.networkStats;
          totalVolume = Object.values(networkStats).reduce((s, n) => s + (parseFloat(n.volume) || 0), 0);
        }
        if (built.topPairs.length > 0) {
          topPairs = built.topPairs;
        }
        // Use DefiLlama total24h if we have no volume
        if (totalVolume === 0 && llamaData.total24h) {
          totalVolume = llamaData.total24h;
        }
      }

      // Final fallback: CoinGecko total volume for display
      if (totalVolume === 0 && globalMarketData?.data?.total_volume?.usd) {
        totalVolume = globalMarketData.data.total_volume.usd;
      }

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

