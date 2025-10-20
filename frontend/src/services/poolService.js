import axios from 'axios';
import { ethers } from 'ethers';
import config from '../config';
import { getContractAddress } from '../config/contracts';
import blockchainPoolService from './blockchainPoolService';

// Helper function to get API URL
const getApiUrl = () => {
  return config.apiUrl || 'http://localhost:8787';
};

// Get all pools (public)
export const getAllPools = async (chainId = null, page = 1, limit = 20) => {
  try {
    // First try to get data from API
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (chainId) {
        params.append('chainId', chainId.toString());
      }
      
      const response = await axios.get(`${getApiUrl()}/api/liquidity/pools?${params}`);
      const apiData = response.data.data || [];
      
      // If API has data, return it
      if (apiData.length > 0) {
        return apiData;
      }
    } catch (apiError) {
      console.warn('API call failed, falling back to blockchain data:', apiError);
    }
    
    // Fallback to blockchain data
    if (window.ethereum && chainId) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await blockchainPoolService.initialize(provider, chainId);
        const blockchainData = await blockchainPoolService.getAllPools(limit);
        return blockchainData;
      } catch (blockchainError) {
        console.error('Blockchain fallback failed:', blockchainError);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch pools:', error);
    return [];
  }
};

// Get user's liquidity positions
export const getUserLiquidityPositions = async (account, chainId = null) => {
  try {
    if (!account) return [];
    
    // First try to get data from API
    try {
      const params = new URLSearchParams();
      if (chainId) {
        params.append('chainId', chainId.toString());
      }
      
      const response = await axios.get(`${getApiUrl()}/api/liquidity/positions/${account}?${params}`);
      const apiData = response.data.data || [];
      
      // If API has data, return it
      if (apiData.length > 0) {
        return apiData;
      }
    } catch (apiError) {
      console.warn('API call failed, falling back to blockchain data:', apiError);
    }
    
    // Fallback to blockchain data
    if (window.ethereum && chainId) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await blockchainPoolService.initialize(provider, chainId);
        const blockchainData = await blockchainPoolService.getUserPositions(account);
        return blockchainData;
      } catch (blockchainError) {
        console.error('Blockchain fallback failed:', blockchainError);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch user liquidity positions:', error);
    return [];
  }
};

// Get user's created pools
export const getUserCreatedPools = async (account, chainId = null) => {
  try {
    if (!account) return [];
    
    // First try to get data from API
    try {
      const params = new URLSearchParams();
      if (chainId) {
        params.append('chainId', chainId.toString());
      }
      
      const response = await axios.get(`${getApiUrl()}/api/liquidity/created/${account}?${params}`);
      const apiData = response.data.data || [];
      
      // If API has data, return it
      if (apiData.length > 0) {
        return apiData;
      }
    } catch (apiError) {
      console.warn('API call failed, falling back to blockchain data:', apiError);
    }
    
    // Fallback to blockchain data
    if (window.ethereum && chainId) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await blockchainPoolService.initialize(provider, chainId);
        const blockchainData = await blockchainPoolService.getUserCreatedPools(account);
        return blockchainData;
      } catch (blockchainError) {
        console.error('Blockchain fallback failed:', blockchainError);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch user created pools:', error);
    return [];
  }
};

// Get pool details by address
export const getPoolDetails = async (poolAddress, chainId) => {
  try {
    const response = await axios.get(`${getApiUrl()}/api/liquidity/pool/${poolAddress}?chainId=${chainId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Failed to fetch pool details:', error);
    return null;
  }
};

// Get pool analytics
export const getPoolAnalytics = async (poolAddress, chainId) => {
  try {
    // First try to get data from API
    try {
      const response = await axios.get(`${getApiUrl()}/api/liquidity/analytics/${poolAddress}?chainId=${chainId}`);
      const apiData = response.data.data || null;
      
      // If API has data, return it
      if (apiData) {
        return apiData;
      }
    } catch (apiError) {
      console.warn('API call failed, falling back to blockchain data:', apiError);
    }
    
    // Fallback to blockchain data
    if (window.ethereum && chainId) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await blockchainPoolService.initialize(provider, chainId);
        const blockchainData = await blockchainPoolService.getPoolAnalytics(poolAddress);
        return blockchainData;
      } catch (blockchainError) {
        console.error('Blockchain fallback failed:', blockchainError);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch pool analytics:', error);
    return null;
  }
};

// Fetch user pools from blockchain (fallback method)
export const fetchUserPoolsFromBlockchain = async (account, chainId) => {
  try {
    if (!window.ethereum || !account) return [];
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const factoryAddress = getContractAddress(chainId, 'dexFactory');
    
    if (!factoryAddress) {
      console.error('DEXFactory not found for chainId:', chainId);
      return [];
    }
    
    // Get DEXFactory contract
    const factoryContract = new ethers.Contract(factoryAddress, [
      'function allPairs(uint256) external view returns (address)',
      'function allPairsLength() external view returns (uint256)',
      'function getPair(address, address) external view returns (address)'
    ], provider);
    
    // Get total number of pairs
    const totalPairs = await factoryContract.allPairsLength();
    const userPools = [];
    
    // Scan through recent pairs (last 1000 for efficiency)
    const startIndex = Math.max(0, Number(totalPairs) - 1000);
    
    for (let i = startIndex; i < Number(totalPairs); i++) {
      try {
        const pairAddress = await factoryContract.allPairs(i);
        
        // Get pair contract
        const pairContract = new ethers.Contract(pairAddress, [
          'function token0() external view returns (address)',
          'function token1() external view returns (address)',
          'function balanceOf(address) external view returns (uint256)',
          'function totalSupply() external view returns (uint256)',
          'function getReserves() external view returns (uint112, uint112, uint32)',
          'function fee() external view returns (uint256)'
        ], provider);
        
        // Check if user has LP tokens
        const userBalance = await pairContract.balanceOf(account);
        
        if (userBalance > 0n) {
          const [token0, token1, totalSupply, reserves, fee] = await Promise.all([
            pairContract.token0(),
            pairContract.token1(),
            pairContract.totalSupply(),
            pairContract.getReserves(),
            pairContract.fee()
          ]);
          
          // Get token info
          const token0Contract = new ethers.Contract(token0, [
            'function symbol() external view returns (string)',
            'function name() external view returns (string)',
            'function decimals() external view returns (uint8)'
          ], provider);
          
          const token1Contract = new ethers.Contract(token1, [
            'function symbol() external view returns (string)',
            'function name() external view returns (string)',
            'function decimals() external view returns (uint8)'
          ], provider);
          
          const [token0Info, token1Info] = await Promise.all([
            Promise.all([
              token0Contract.symbol(),
              token0Contract.name(),
              token0Contract.decimals()
            ]),
            Promise.all([
              token1Contract.symbol(),
              token1Contract.name(),
              token1Contract.decimals()
            ])
          ]);
          
          // Calculate user's share
          const userShare = Number(userBalance) / Number(totalSupply);
          const userToken0Amount = Number(reserves[0]) * userShare;
          const userToken1Amount = Number(reserves[1]) * userShare;
          
          userPools.push({
            address: pairAddress,
            token0: {
              address: token0,
              symbol: token0Info[0],
              name: token0Info[1],
              decimals: token0Info[2],
              amount: userToken0Amount,
              formattedAmount: ethers.formatUnits(userToken0Amount, token0Info[2])
            },
            token1: {
              address: token1,
              symbol: token1Info[0],
              name: token1Info[1],
              decimals: token1Info[2],
              amount: userToken1Amount,
              formattedAmount: ethers.formatUnits(userToken1Amount, token1Info[2])
            },
            lpBalance: userBalance.toString(),
            totalSupply: totalSupply.toString(),
            userShare: userShare,
            fee: Number(fee) / 10000, // Convert from basis points to percentage
            chainId: chainId,
            createdAt: Date.now() // We don't have creation time from contract
          });
        }
      } catch (error) {
        // Skip pairs that fail to load
        console.warn('Failed to load pair at index', i, error);
      }
    }
    
    return userPools;
  } catch (error) {
    console.error('Failed to fetch user pools from blockchain:', error);
    return [];
  }
};

// Get user portfolio summary
export const getUserPortfolioSummary = async (account, chainId = null) => {
  try {
    if (!account) return null;
    
    const params = new URLSearchParams();
    if (chainId) {
      params.append('chainId', chainId.toString());
    }
    
    const response = await axios.get(`${getApiUrl()}/api/portfolio/${account}?${params}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Failed to fetch user portfolio summary:', error);
    return null;
  }
};

// Collect fees from a pool
export const collectFees = async (poolAddress, chainId) => {
  try {
    const response = await axios.post(`${getApiUrl()}/api/liquidity/collect-fees`, {
      poolAddress,
      chainId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to collect fees:', error);
    throw error;
  }
};

// Remove liquidity from a pool
export const removeLiquidity = async (poolAddress, liquidityAmount, chainId) => {
  try {
    const response = await axios.post(`${getApiUrl()}/api/liquidity/remove`, {
      poolAddress,
      liquidityAmount,
      chainId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to remove liquidity:', error);
    throw error;
  }
}; 