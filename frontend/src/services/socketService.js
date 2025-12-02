// Socket API Service (Bridge Aggregator)
// Provides best routes for cross-chain token transfers
// Documentation: https://docs.socket.tech/
// Setup Guide: See SOCKET_API_SETUP_GUIDE.md

class SocketService {
  constructor() {
    // Socket API key (get from https://socket.tech/)
    this.apiKey = process.env.REACT_APP_SOCKET_API_KEY || null;
    
    // Socket API base URL
    this.baseUrl = 'https://api.socket.tech/v2';
    
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
      headers['API-KEY'] = this.apiKey;
    }
    
    return headers;
  }

  // Get bridge quote (best route)
  async getQuote(params) {
    const {
      fromChainId,
      toChainId,
      fromTokenAddress,
      toTokenAddress,
      amount,
      userAddress
    } = params;

    if (!this.isConfigured()) {
      console.warn('Socket API key not configured. Please add REACT_APP_SOCKET_API_KEY to environment variables.');
      return null;
    }

    const cacheKey = `quote_${fromChainId}_${toChainId}_${fromTokenAddress}_${toTokenAddress}_${amount}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const queryParams = new URLSearchParams({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        fromTokenAddress,
        toTokenAddress,
        amount: amount.toString(),
        userAddress
      });

      const response = await fetch(`${this.baseUrl}/quote?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Socket API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to get quote');
      }

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching Socket quote:', error);
      return null;
    }
  }

  // Build bridge transaction
  async buildTransaction(params) {
    const {
      route,
      userAddress,
      recipientAddress
    } = params;

    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/build-tx`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          route,
          userAddress,
          recipientAddress: recipientAddress || userAddress
        })
      });

      if (!response.ok) {
        throw new Error(`Socket API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to build transaction');
      }

      return data;
    } catch (error) {
      console.error('Error building Socket transaction:', error);
      return null;
    }
  }

  // Get supported tokens for a chain
  async getTokenList(chainId) {
    if (!this.isConfigured()) {
      return null;
    }

    const cacheKey = `tokens_${chainId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/token-lists?chainId=${chainId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Socket API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching token list:', error);
      return null;
    }
  }

  // Get chain status
  async getChainStatus() {
    if (!this.isConfigured()) {
      return null;
    }

    const cacheKey = 'chain_status';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chains`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Socket API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching chain status:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

