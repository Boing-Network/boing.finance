// Analytics Service
// Fetches data from GeckoTerminal, DefiLlama, CoinGecko (The Graph hosted service deprecated/removed)

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const GEECKO_TERMINAL_BASE = 'https://api.geckoterminal.com/api/v2';

// GeckoTerminal network id -> chainId
const GEECKO_TO_CHAIN = {
  eth: 1,
  bsc: 56,
  polygon_pos: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
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
  }

  // Fetch top pools from GeckoTerminal for a network (rate limited ~10/min)
  async getGeckoTerminalPools(networkId = 'eth', page = 1) {
    try {
      const url = `${GEECKO_TERMINAL_BASE}/networks/${networkId}/pools?page=${page}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.data || [];
    } catch (e) {
      console.warn(`GeckoTerminal pools (${networkId}):`, e?.message);
      return null;
    }
  }

  // Build networkStats and topPairs from GeckoTerminal pool data (real token pairs)
  buildFromGeckoTerminal(poolsByNetwork) {
    const networkStats = {};
    const allPairs = [];

    for (const [networkId, pools] of Object.entries(poolsByNetwork)) {
      if (!Array.isArray(pools) || pools.length === 0) continue;
      const chainId = GEECKO_TO_CHAIN[networkId];
      const networkName = chainId ? this.getNetworkName(chainId) : networkId;

      let networkVol = 0;
      for (const pool of pools) {
        const attrs = pool?.attributes || {};
        const name = attrs.name || 'Unknown / Unknown';
        const volUsd = attrs.volume_usd;
        const vol24h = typeof volUsd === 'object' && volUsd?.h24 != null
          ? parseFloat(volUsd.h24) || 0
          : 0;
        const reserve = parseFloat(attrs.reserve_in_usd) || 0;
        networkVol += vol24h;

        // Parse token symbols from name (e.g. "WETH / USDC 0.05%" -> WETH, USDC)
        const parts = name.split(/\s*\/\s*/).map((s) => s.replace(/\s+[\d.]+%$/, '').trim());
        const token0 = parts[0] || 'Unknown';
        const token1 = parts[1] || 'Unknown';

        allPairs.push({
          token0Symbol: token0,
          token1Symbol: token1,
          network: networkName,
          volume: Math.round(vol24h).toString(),
          liquidity: Math.round(reserve).toString(),
          apy: null
        });
      }

      if (networkVol > 0) {
        networkStats[networkName] = {
          volume: Math.round(networkVol).toString(),
          liquidity: '0',
          pools: pools.length,
          users: 0,
          transactions: 0
        };
      }
    }

    const topPairs = allPairs
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
      .slice(0, 15);

    return { networkStats, topPairs };
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

  // Fetch DEX overview from DefiLlama (primary for network-level stats)
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
  // Uses breakdown24h for 24h range, breakdown30d for 7d/30d
  buildFromDefiLlama(llamaData, networks, range = '24h') {
    const networkStats = {};
    const pairVolumeMap = {}; // "DEX|Ethereum" -> volume

    if (!llamaData?.protocols?.length) return { networkStats: {}, topPairs: [] };

    const use24h = range === '24h';
    for (const proto of llamaData.protocols) {
      const breakdown = use24h ? proto.breakdown24h : proto.breakdown30d;
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

  // Aggregate analytics data for a time range
  // Uses GeckoTerminal for real token pairs; DefiLlama for network-level stats
  async getAnalyticsData(range = '24h', networks = []) {
    try {
      const defaultNetworks = [1, 137, 56, 42161, 10, 8453];
      const targetNetworks = networks.length > 0 ? networks : defaultNetworks;

      // GeckoTerminal network ids for supported chains
      const geckoNetworks = ['eth', 'arbitrum', 'base', 'polygon_pos', 'bsc', 'optimism'];

      // Fetch CoinGecko, GeckoTerminal pools, and DefiLlama in parallel
      const [globalMarketData, geckoPools, llamaData] = await Promise.all([
        this.getGlobalMarketData(),
        Promise.all(geckoNetworks.map((id) => this.getGeckoTerminalPools(id))).then((results) =>
          Object.fromEntries(geckoNetworks.map((id, i) => [id, results[i] || []]))
        ),
        this.getDefiLlamaDexData()
      ]);

      let networkStats = {};
      let topPairs = [];
      let totalVolume = 0;
      let totalLiquidity = 0;
      let totalPools = 0;
      let totalTransactions = 0;

      // Primary: GeckoTerminal (real token pairs like WETH/USDC)
      const geckoBuilt = this.buildFromGeckoTerminal(geckoPools);
      if (Object.keys(geckoBuilt.networkStats).length > 0 || geckoBuilt.topPairs.length > 0) {
        networkStats = geckoBuilt.networkStats;
        topPairs = geckoBuilt.topPairs;
        totalVolume = Object.values(networkStats).reduce((s, n) => s + (parseFloat(n.volume) || 0), 0);
      }

      // DefiLlama: supplement/fallback for network stats (time-range-aware)
      if (llamaData) {
        const llamaBuilt = this.buildFromDefiLlama(llamaData, targetNetworks, range);
        if (Object.keys(networkStats).length === 0 && Object.keys(llamaBuilt.networkStats).length > 0) {
          networkStats = llamaBuilt.networkStats;
          totalVolume = Object.values(networkStats).reduce((s, n) => s + (parseFloat(n.volume) || 0), 0);
        } else if (Object.keys(llamaBuilt.networkStats).length > 0) {
          // Merge DefiLlama volumes into networkStats for more complete data
          for (const [net, stats] of Object.entries(llamaBuilt.networkStats)) {
            const vol = parseFloat(stats?.volume || 0) || 0;
            if (!networkStats[net]) networkStats[net] = { volume: '0', liquidity: '0', pools: 0, users: 0, transactions: 0 };
            const prev = parseFloat(networkStats[net].volume) || 0;
            if (vol > prev) networkStats[net].volume = stats.volume;
          }
          totalVolume = Object.values(networkStats).reduce((s, n) => s + (parseFloat(n.volume) || 0), 0);
        }
        if (topPairs.length === 0 && llamaBuilt.topPairs.length > 0) {
          topPairs = llamaBuilt.topPairs;
        }
        if (totalVolume === 0 && (range === '24h' ? llamaData.total24h : llamaData.total30d)) {
          totalVolume = range === '24h' ? llamaData.total24h : llamaData.total30d;
        }
      }

      // Final fallback: CoinGecko total volume
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

