// Alchemy API Service
// Provides enhanced blockchain data and RPC endpoints
// Documentation: https://docs.alchemy.com/

class AlchemyService {
  constructor() {
    // Alchemy API key
    this.apiKey = process.env.REACT_APP_ALCHEMY_API_KEY || 'AnPJpd_2eIKzRWRJM9oKp';
    
    // Network to Alchemy network mapping
    this.networkMap = {
      1: 'eth-mainnet',
      137: 'polygon-mainnet',
      56: 'bsc-mainnet', // Note: Alchemy doesn't support BSC, will use public RPC
      42161: 'arb-mainnet',
      10: 'opt-mainnet',
      8453: 'base-mainnet',
      11155111: 'eth-sepolia'
    };

    // Base URLs for different services
    this.rpcBaseUrl = 'https://{network}.g.alchemy.com/v2/{apiKey}';
    this.apiBaseUrl = 'https://{network}.g.alchemy.com/v2/{apiKey}';
    
    // Cache
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 second cache
  }

  // Get RPC URL for a network
  getRpcUrl(chainId) {
    const network = this.networkMap[chainId];
    if (!network) {
      return null; // Use default RPC from networks config
    }

    // BSC is not supported by Alchemy, return null to use public RPC
    if (chainId === 56) {
      return null;
    }

    return this.rpcBaseUrl
      .replace('{network}', network)
      .replace('{apiKey}', this.apiKey);
  }

  // Get API URL for a network
  getApiUrl(chainId, endpoint = '') {
    const network = this.networkMap[chainId];
    if (!network) {
      return null;
    }

    if (chainId === 56) {
      return null; // BSC not supported
    }

    const baseUrl = this.apiBaseUrl
      .replace('{network}', network)
      .replace('{apiKey}', this.apiKey);
    
    return endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
  }

  // Enhanced RPC call with Alchemy
  async rpcCall(chainId, method, params = []) {
    const rpcUrl = this.getRpcUrl(chainId);
    if (!rpcUrl) {
      return null; // Fallback to default RPC
    }

    const cacheKey = `${chainId}_${method}_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`Alchemy RPC error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC error');
      }

      this.cache.set(cacheKey, { data: data.result, timestamp: Date.now() });
      return data.result;
    } catch (error) {
      console.error('Error in Alchemy RPC call:', error);
      return null;
    }
  }

  // Get token metadata (ERC20/ERC721)
  async getTokenMetadata(chainId, contractAddress) {
    const apiUrl = this.getApiUrl(chainId, 'getTokenMetadata');
    if (!apiUrl) {
      return null;
    }

    const cacheKey = `metadata_${chainId}_${contractAddress}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 10) { // 5 min cache for metadata
      return cached.data;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [contractAddress]
        })
      });

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      this.cache.set(cacheKey, { data: data.result, timestamp: Date.now() });
      return data.result;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  // Get token balances for an address
  async getTokenBalances(chainId, address) {
    const apiUrl = this.getApiUrl(chainId, 'getTokenBalances');
    if (!apiUrl) {
      return null;
    }

    const cacheKey = `balances_${chainId}_${address}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [address]
        })
      });

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      const result = data.result;
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return null;
    }
  }

  // Get asset transfers for an address
  async getAssetTransfers(chainId, address, fromBlock = 'latest', toBlock = 'latest') {
    const apiUrl = this.getApiUrl(chainId, 'alchemy_getAssetTransfers');
    if (!apiUrl) {
      return null;
    }

    const cacheKey = `transfers_${chainId}_${address}_${fromBlock}_${toBlock}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock,
            toBlock,
            fromAddress: address,
            category: ['erc20', 'external']
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      this.cache.set(cacheKey, { data: data.result, timestamp: Date.now() });
      return data.result;
    } catch (error) {
      console.error('Error fetching asset transfers:', error);
      return null;
    }
  }

  // Get transaction details
  async getTransaction(chainId, txHash) {
    return await this.rpcCall(chainId, 'eth_getTransactionByHash', [txHash]);
  }

  // Get block number
  async getBlockNumber(chainId) {
    return await this.rpcCall(chainId, 'eth_blockNumber', []);
  }

  // Get gas price
  async getGasPrice(chainId) {
    return await this.rpcCall(chainId, 'eth_gasPrice', []);
  }

  /**
   * Get NFTs owned by an address (Alchemy NFT API v3)
   * @param {number} chainId - Chain ID (1, 137, 42161, 10, 8453, 11155111)
   * @param {string} ownerAddress - Wallet address
   * @param {object} options - { pageSize, pageKey, withMetadata }
   * @returns {Promise<{ownedNfts: Array, pageKey?: string, totalCount?: number}>}
   */
  async getNFTsForOwner(chainId, ownerAddress, options = {}) {
    const network = this.networkMap[chainId];
    if (!network || chainId === 56) {
      return { ownedNfts: [], totalCount: 0 }; // BSC not supported
    }

    const cacheKey = `nfts_${chainId}_${ownerAddress}_${options.pageKey || '0'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) {
      return cached.data;
    }

    const baseUrl = `https://${network}.g.alchemy.com/nft/v3/${this.apiKey}/getNFTsForOwner`;
    const params = new URLSearchParams({
      owner: ownerAddress,
      'withMetadata': options.withMetadata !== false ? 'true' : 'false',
      'pageSize': String(options.pageSize || 50),
      ...(options.pageKey && { pageKey: options.pageKey })
    });

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`Alchemy NFT API error: ${response.status}`);
      }
      const data = await response.json();
      const result = {
        ownedNfts: data.ownedNfts || [],
        pageKey: data.pageKey,
        totalCount: data.totalCount
      };
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return { ownedNfts: [], totalCount: 0 };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const alchemyService = new AlchemyService();
export default alchemyService;

