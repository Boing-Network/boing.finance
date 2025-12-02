import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import blockchainPoolService from '../services/blockchainPoolService';
import { ethers } from 'ethers';

export const useBlockchainPools = () => {
  const { account, chainId } = useWallet();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the blockchain service
  // Returns true if contracts are available, false if API-only mode
  const initializeService = useCallback(async () => {
    if (!window.ethereum || !chainId) {
      // Don't set error - allow API-only mode
      setIsInitialized(false);
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const initialized = await blockchainPoolService.initialize(provider, chainId);
      
      // Set initialized to true even if contracts aren't available (API-only mode)
      setIsInitialized(true);
      return initialized; // Return whether contracts are available
    } catch (err) {
      // Don't set error - allow graceful degradation to API-only mode
      console.warn('Blockchain service initialization failed, using API-only mode:', err.message);
      setIsInitialized(true); // Still mark as initialized for API-only features
      return false; // Contracts not available
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  // Get user's liquidity positions
  // Works in API-only mode using The Graph if contracts not available
  const getUserPositions = useCallback(async () => {
    if (!isInitialized || !account) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Try blockchain first if contracts available
      if (blockchainPoolService.dexFactory) {
        return await blockchainPoolService.getUserPositions(account);
      }
      
      // Fallback to API-only mode (The Graph)
      // This will be handled by the Portfolio component using portfolioService
      return [];
    } catch (err) {
      console.warn('Failed to get user positions from blockchain, using API fallback:', err.message);
      // Don't set error - allow API fallback
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, account]);

  // Get all pools
  const getAllPools = useCallback(async (limit = 50) => {
    if (!isInitialized) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      return await blockchainPoolService.getAllPools(limit);
    } catch (err) {
      setError(`Failed to get all pools: ${err.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Get all Sepolia pools (including external DEXs)
  const getAllSepoliaPools = useCallback(async (limit = 100) => {
    if (!isInitialized) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      return await blockchainPoolService.getAllSepoliaPools(limit);
    } catch (err) {
      setError(`Failed to get all Sepolia pools: ${err.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Get user's created pools
  const getUserCreatedPools = useCallback(async () => {
    if (!isInitialized || !account) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      return await blockchainPoolService.getUserCreatedPools(account);
    } catch (err) {
      setError(`Failed to get user created pools: ${err.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, account]);

  // Get pool information
  const getPoolInfo = useCallback(async (pairAddress) => {
    if (!isInitialized || !pairAddress) {
      return null;
    }

    try {
      setError(null);
      return await blockchainPoolService.getPoolInfo(pairAddress);
    } catch (err) {
      setError(`Failed to get pool info: ${err.message}`);
      return null;
    }
  }, [isInitialized]);

  // Get pool analytics
  const getPoolAnalytics = useCallback(async (pairAddress, timeRange = '24h') => {
    if (!isInitialized || !pairAddress) {
      return null;
    }

    try {
      setError(null);
      return await blockchainPoolService.getPoolAnalytics(pairAddress, timeRange);
    } catch (err) {
      setError(`Failed to get pool analytics: ${err.message}`);
      return null;
    }
  }, [isInitialized]);

  // Get user's portfolio value
  const getUserPortfolioValue = useCallback(async () => {
    if (!isInitialized || !account) {
      return {
        totalValue: 0,
        totalPools: 0,
        totalLiquidity: 0,
        averageAPY: 0
      };
    }

    try {
      setIsLoading(true);
      setError(null);
      return await blockchainPoolService.getUserPortfolioValue(account);
    } catch (err) {
      setError(`Failed to get portfolio value: ${err.message}`);
      return {
        totalValue: 0,
        totalPools: 0,
        totalLiquidity: 0,
        averageAPY: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, account]);

  // Get user's locks
  const getUserLocks = useCallback(async () => {
    if (!isInitialized || !account) {
      return [];
    }

    try {
      setError(null);
      return await blockchainPoolService.getUserLocks(account);
    } catch (err) {
      setError(`Failed to get user locks: ${err.message}`);
      return [];
    }
  }, [isInitialized, account]);

  // Get user's position in a specific pool
  const getUserPositionInPool = useCallback(async (pairAddress) => {
    if (!isInitialized || !account || !pairAddress) {
      return null;
    }
    try {
      setError(null);
      return await blockchainPoolService.getUserPositionInPool(account, pairAddress);
    } catch (err) {
      setError(`Failed to get user position in pool: ${err.message}`);
      return null;
    }
  }, [isInitialized, account]);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (account && chainId && !isInitialized) {
      initializeService();
    }
  }, [account, chainId, isInitialized, initializeService]);

  // Reset when wallet disconnects or network changes
  useEffect(() => {
    if (!account || !chainId) {
      setIsInitialized(false);
      setError(null);
    }
  }, [account, chainId]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    
    // Actions
    initializeService,
    getUserPositions,
    getAllPools,
    getAllSepoliaPools,
    getUserCreatedPools,
    getPoolInfo,
    getPoolAnalytics,
    getUserPortfolioValue,
    getUserLocks,
    getUserPositionInPool,
    
    // Utility
    clearError: () => setError(null)
  };
}; 