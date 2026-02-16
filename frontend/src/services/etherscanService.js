// Etherscan API Service
// Free tier: 5 calls/second, 100,000 calls/day

const ETHERSCAN_API_BASE = {
  ethereum: 'https://api.etherscan.io/api',
  sepolia: 'https://api-sepolia.etherscan.io/api',
  polygon: 'https://api.polygonscan.com/api',
  bsc: 'https://api.bscscan.com/api',
  arbitrum: 'https://api.arbiscan.io/api',
  optimism: 'https://api-optimistic.etherscan.io/api',
  base: 'https://api.basescan.org/api'
};

const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY || 'YourApiKeyToken';

class EtherscanService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 second cache
  }

  // Get API base URL for network
  getApiBase(network = 'ethereum') {
    return ETHERSCAN_API_BASE[network] || ETHERSCAN_API_BASE.ethereum;
  }

  // Make API request
  async makeRequest(network, params) {
    const baseUrl = this.getApiBase(network);
    const queryParams = new URLSearchParams({
      ...params,
      apikey: ETHERSCAN_API_KEY
    });
    
    const url = `${baseUrl}?${queryParams.toString()}`;
    const cacheKey = url;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(data.result || 'Etherscan API error');
      }

      // Cache successful responses
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Etherscan API error:', error);
      throw error;
    }
  }

  // Get transaction history for an address
  async getTransactions(address, network = 'ethereum', startBlock = 0, endBlock = 99999999) {
    try {
      const data = await this.makeRequest(network, {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: startBlock,
        endblock: endBlock,
        sort: 'desc',
        page: 1,
        offset: 100
      });

      return data.result || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Get token transactions for an address
  async getTokenTransactions(address, contractAddress, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'account',
        action: 'tokentx',
        contractaddress: contractAddress,
        address: address,
        page: 1,
        offset: 100,
        sort: 'desc'
      });

      return data.result || [];
    } catch (error) {
      console.error('Error fetching token transactions:', error);
      return [];
    }
  }

  // Get token holder count
  async getTokenHolders(contractAddress, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'token',
        action: 'tokenholderlist',
        contractaddress: contractAddress,
        page: 1,
        offset: 1
      });

      return data.result ? parseInt(data.result[0]?.TokenHolderCount || 0) : 0;
    } catch (error) {
      console.error('Error fetching token holders:', error);
      return 0;
    }
  }

  // Get contract source code (for verification)
  async getContractSource(contractAddress, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress
      });

      if (data.result && data.result[0] && data.result[0].SourceCode) {
        return {
          verified: true,
          sourceCode: data.result[0].SourceCode,
          contractName: data.result[0].ContractName,
          compilerVersion: data.result[0].CompilerVersion,
          optimizationUsed: data.result[0].OptimizationUsed === '1'
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Error fetching contract source:', error);
      return { verified: false };
    }
  }

  // Get token info
  async getTokenInfo(contractAddress, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'token',
        action: 'tokeninfo',
        contractaddress: contractAddress
      });

      return data.result || null;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  // Get account balance
  async getBalance(address, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'account',
        action: 'balance',
        address: address,
        tag: 'latest'
      });

      return data.result || '0';
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  // Get token balance for an address
  async getTokenBalance(address, contractAddress, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'account',
        action: 'tokenbalance',
        contractaddress: contractAddress,
        address: address,
        tag: 'latest'
      });

      return data.result || '0';
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash, network = 'ethereum') {
    try {
      const data = await this.makeRequest(network, {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash
      });

      return data.result || null;
    } catch (error) {
      console.error('Error fetching transaction receipt:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

const etherscanServiceInstance = new EtherscanService();
export default etherscanServiceInstance;

