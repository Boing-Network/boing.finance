// LiFi API Service (Bridge Aggregator - Alternative to Socket)
// Provides best routes for cross-chain token transfers
// Documentation: https://docs.li.fi/
// Sign up: https://li.fi/ (Free tier available)

class LiFiService {
  constructor() {
    // LiFi API key (get from https://li.fi/ - free tier available)
    this.apiKey = process.env.REACT_APP_LIFI_API_KEY || null;
    
    // LiFi API base URL
    this.baseUrl = 'https://li.quest/v1';
    
    // Cache for quotes
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 second cache for quotes
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey;
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['x-lifi-api-key'] = this.apiKey;
    }
    
    return headers;
  }

  // Get bridge quote (best route)
  async getQuote(params) {
    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      fromAddress
    } = params;

    const cacheKey = `quote_${fromChain}_${toChain}_${fromToken}_${toToken}_${fromAmount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/quote`, {
        method: 'GET',
        headers: this.getHeaders(),
        params: new URLSearchParams({
          fromChain: fromChain.toString(),
          toChain: toChain.toString(),
          fromToken,
          toToken,
          fromAmount: fromAmount.toString(),
          fromAddress
        })
      });

      if (!response.ok) {
        throw new Error(`LiFi API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching LiFi quote:', error);
      return null;
    }
  }

  // Get supported chains
  async getChains() {
    const cacheKey = 'chains';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chains`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`LiFi API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching chains:', error);
      return null;
    }
  }

  // Get supported tokens for a chain
  async getTokens(chainId) {
    const cacheKey = `tokens_${chainId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/tokens?chains=${chainId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`LiFi API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return null;
    }
  }

  // Get transaction status
  async getStatus(txHash, fromChain) {
    try {
      const response = await fetch(`${this.baseUrl}/status?txHash=${txHash}&fromChain=${fromChain}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`LiFi API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching status:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const lifiService = new LiFiService();
export default lifiService;

