// Analytics Service
// Handles user activity tracking and analytics data fetching

import config from '../config';

/**
 * Track user activity (swaps, liquidity actions, etc.)
 * @param {Object} activityData - Activity data to track
 * @param {string} activityData.action - Action type ('swap', 'liquidity_add', 'liquidity_remove', 'search', 'view')
 * @param {string} [activityData.tokenAddress] - Token address involved
 * @param {string} [activityData.pairAddress] - Pair address involved
 * @param {number} [activityData.chainId] - Chain ID
 * @param {string} [activityData.amount] - Amount involved
 * @param {string} [activityData.txHash] - Transaction hash
 * @param {Object} [activityData.metadata] - Additional metadata
 */
export const trackUserActivity = async (activityData) => {
  try {
    // Get user wallet address from localStorage or context
    // This is safe because wallet addresses are public information
    const walletAddress = localStorage.getItem('walletAddress') || 
                         sessionStorage.getItem('walletAddress') || 
                         'anonymous';
    
    const response = await fetch(`${config.apiUrl}/analytics/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: walletAddress,
        ...activityData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to track user activity:', response.status);
    }
  } catch (error) {
    // Silently fail - don't interrupt user flow
    console.warn('Error tracking user activity:', error.message);
  }
};

/**
 * Fetch user activity from blockchain (on-chain transactions)
 * This queries public blockchain data, so no privacy concerns
 * @param {string} walletAddress - User's wallet address
 * @param {number} chainId - Chain ID to query
 * @param {string} [timeRange] - Time range ('24h', '7d', '30d', '1y')
 * @returns {Promise<Object>} User activity data
 */
export const fetchWalletActivity = async (walletAddress, chainId, timeRange = '30d') => {
  try {
    if (!walletAddress || walletAddress === 'anonymous') {
      return null;
    }

    const response = await fetch(
      `${config.apiUrl}/analytics/wallet-activity?address=${walletAddress}&chainId=${chainId}&range=${timeRange}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.warn('Error fetching wallet activity:', error.message);
    return null;
  }
};

/**
 * Track a swap transaction
 */
export const trackSwap = async (swapData) => {
  return trackUserActivity({
    action: 'swap',
    ...swapData
  });
};

/**
 * Track liquidity addition
 */
export const trackLiquidityAdd = async (liquidityData) => {
  return trackUserActivity({
    action: 'liquidity_add',
    ...liquidityData
  });
};

/**
 * Track liquidity removal
 */
export const trackLiquidityRemove = async (liquidityData) => {
  return trackUserActivity({
    action: 'liquidity_remove',
    ...liquidityData
  });
};

/**
 * Track a search action
 */
export const trackSearch = async (query, resultCount, chainId = null) => {
  return trackUserActivity({
    action: 'search',
    metadata: {
      query,
      resultCount,
      chainId
    }
  });
};

/**
 * Track a page view
 */
export const trackPageView = async (page, metadata = {}) => {
  return trackUserActivity({
    action: 'view',
    metadata: {
      page,
      ...metadata
    }
  });
};

const analyticsService = {
  trackUserActivity,
  fetchWalletActivity,
  trackSwap,
  trackLiquidityAdd,
  trackLiquidityRemove,
  trackSearch,
  trackPageView
};
export default analyticsService;

