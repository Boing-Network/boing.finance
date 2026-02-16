// CoinGecko API Service
// Free tier: 50 calls/minute, no API key needed for basic usage
// Uses shared apiClient for market chart (retry + cache) when available for reliability.

import { cachedFetch } from '../utils/apiClient';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.REACT_APP_COINGECKO_API_KEY;

class CoinGeckoService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // Get API URL with optional API key
  getApiUrl(endpoint) {
    const url = `${COINGECKO_API_BASE}${endpoint}`;
    if (COINGECKO_API_KEY) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${url}${separator}x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    }
    return url;
  }

  // Get global market data
  async getGlobalMarketData() {
    try {
      const response = await fetch(this.getApiUrl('/global'));
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching global market data:', error);
      return null;
    }
  }

  // Get token price by contract address or coin ID
  async getTokenPrice(contractAddress, network = 'ethereum') {
    // Handle coin IDs (for native tokens)
    if (network === 'coins') {
      return this.getCoinPrice(contractAddress);
    }
    const cacheKey = `price_${network}_${contractAddress}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(
        this.getApiUrl(`/simple/token_price/${network}?contract_addresses=${contractAddress}&vs_currencies=usd&include_24hr_change=true`)
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const priceData = data[contractAddress.toLowerCase()];
      
      if (priceData) {
        this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
        return priceData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  // Get multiple token prices
  async getTokenPrices(contractAddresses, network = 'ethereum') {
    const addresses = Array.isArray(contractAddresses) 
      ? contractAddresses.join(',') 
      : contractAddresses;
    
    try {
      const response = await fetch(
        this.getApiUrl(`/simple/token_price/${network}?contract_addresses=${addresses}&vs_currencies=usd&include_24hr_change=true`)
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }

  // Get token info by contract address
  async getTokenInfo(contractAddress, network = 'ethereum') {
    try {
      const response = await fetch(
        this.getApiUrl(`/coins/${network}/contract/${contractAddress}`)
      );
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  // Get coin price by ID (for native tokens)
  async getCoinPrice(coinId) {
    const cacheKey = `coin_price_${coinId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(
        this.getApiUrl(`/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`)
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const priceData = data[coinId];
      
      if (priceData) {
        this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
        return priceData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching coin price:', error);
      return null;
    }
  }

  // Get market chart (prices + volumes) by coin ID - for historical charts (with retry + cache)
  async getMarketChartByCoinId(coinId, days = 7) {
    const cacheKey = `market_chart_${coinId}_${days}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 5) {
      return cached.data;
    }
    try {
      const url = this.getApiUrl(`/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await cachedFetch(url, {}, { ttlMs: 5 * 60 * 1000, retries: 2 });
      if (data) this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data ?? null;
    } catch (error) {
      console.error('Error fetching market chart:', error);
      return null;
    }
  }

  // Get price history by coin ID (for trending/native tokens like bitcoin, ethereum)
  async getPriceHistoryByCoinId(coinId, days = 7) {
    const cacheKey = `history_coin_${coinId}_${days}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 5) {
      return cached.data;
    }
    try {
      const response = await fetch(
        this.getApiUrl(`/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`)
      );
      if (!response.ok) return null;
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching price history by coin ID:', error);
      return null;
    }
  }

  // Get price history for charting
  async getPriceHistory(contractAddress, days = 7, network = 'ethereum') {
    const cacheKey = `history_${network}_${contractAddress}_${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 5) {
      return cached.data;
    }

    try {
      const response = await fetch(
        this.getApiUrl(`/coins/${network}/contract/${contractAddress}/market_chart?vs_currency=usd&days=${days}`)
      );
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return null;
    }
  }

  // Get coin by ID (includes platforms with contract addresses per chain)
  async getCoinById(coinId) {
    const cacheKey = `coin_${coinId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) {
      return cached.data;
    }
    try {
      const response = await fetch(
        this.getApiUrl(`/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`)
      );
      if (!response.ok) return null;
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching coin by ID:', error);
      return null;
    }
  }

  // Search for tokens
  async searchTokens(query) {
    try {
      const response = await fetch(
        this.getApiUrl(`/search?query=${encodeURIComponent(query)}`)
      );
      
      if (!response.ok) {
        return { coins: [], nfts: [], exchanges: [] };
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching tokens:', error);
      return { coins: [], nfts: [], exchanges: [] };
    }
  }

  // Get trending NFT collections (CoinGecko - may require Pro for full access)
  async getNftMarkets(limit = 10) {
    try {
      const response = await fetch(
        this.getApiUrl(`/nfts/markets?order=volume_24h_native_desc&per_page=${limit}`)
      );
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Error fetching NFT markets:', error);
      return [];
    }
  }

  // Get trending tokens
  async getTrendingTokens() {
    try {
      const response = await fetch(this.getApiUrl('/search/trending'));
      
      if (!response.ok) {
        return { coins: [] };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return { coins: [] };
    }
  }

  // Get market data
  async getMarketData(contractAddress, network = 'ethereum') {
    try {
      const response = await fetch(
        this.getApiUrl(`/coins/${network}/contract/${contractAddress}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`)
      );
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

const coingeckoServiceInstance = new CoinGeckoService();
export default coingeckoServiceInstance;

