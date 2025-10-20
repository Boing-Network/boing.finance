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
  const initializeService = useCallback(async () => {
    if (!window.ethereum || !chainId) {
      setError('Wallet not connected or unsupported network');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await blockchainPoolService.initialize(provider, chainId);
      
      setIsInitialized(true);
      return true;
    } catch (err) {
      setError(`Failed to initialize blockchain service: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  // Get user's liquidity positions
  const getUserPositions = useCallback(async () => {
    if (!isInitialized || !account) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      return await blockchainPoolService.getUserPositions(account);
    } catch (err) {
      setError(`Failed to get user positions: ${err.message}`);
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