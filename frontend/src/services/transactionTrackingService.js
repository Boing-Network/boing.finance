import axios from 'axios';
import { getApiUrl } from '../config.js';

class TransactionTrackingService {
  constructor() {
    this.subscribers = new Set();
    this.lastTransactionCount = 0;
  }

  // Subscribe to transaction updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers of new transactions
  notifyNewTransactions(transactions) {
    this.subscribers.forEach(callback => {
      try {
        callback(transactions);
      } catch (error) {
        console.error('Error in transaction subscriber:', error);
      }
    });
  }

  // Add a new transaction to the history
  async addTransaction(transactionData) {
    try {
      const apiUrl = getApiUrl();
      const response = await axios.post(`${apiUrl}/transactions`, transactionData);
      
      if (response.data.success) {
        // Notify subscribers of the new transaction
        this.notifyNewTransactions([response.data.data]);
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to add transaction to history:', error);
      // Still notify subscribers with local data
      this.notifyNewTransactions([transactionData]);
    }
  }

  // Track a successful swap transaction
  async trackSwapTransaction(txHash, receipt, swapData) {
    const transactionData = {
      type: 'swap',
      status: 'confirmed',
      txHash: txHash,
      chainId: swapData.chainId,
      sender: swapData.account,
      tokenIn: swapData.tokenIn,
      tokenOut: swapData.tokenOut,
      amountIn: swapData.amountIn,
      amountOut: swapData.amountOut,
      timestamp: new Date().toISOString(),
      blockNumber: receipt.blockNumber
    };

    return this.addTransaction(transactionData);
  }

  // Track a liquidity transaction
  async trackLiquidityTransaction(txHash, receipt, liquidityData) {
    const transactionData = {
      type: 'liquidity',
      status: 'confirmed',
      txHash: txHash,
      chainId: liquidityData.chainId,
      provider: liquidityData.account,
      action: liquidityData.action, // 'add' or 'remove'
      pairAddress: liquidityData.pairAddress,
      amount0: liquidityData.amount0,
      amount1: liquidityData.amount1,
      timestamp: new Date().toISOString(),
      blockNumber: receipt.blockNumber
    };

    return this.addTransaction(transactionData);
  }

  // Track a bridge transaction
  async trackBridgeTransaction(txHash, bridgeData) {
    const transactionData = {
      type: 'bridge',
      status: 'pending',
      txHash: txHash,
      fromChain: bridgeData.fromChain,
      toChain: bridgeData.toChain,
      userAddress: bridgeData.userAddress,
      token: bridgeData.token,
      amount: bridgeData.amount,
      timestamp: new Date().toISOString()
    };

    return this.addTransaction(transactionData);
  }

  // Get transaction count for comparison
  getTransactionCount() {
    return this.lastTransactionCount;
  }

  // Update transaction count
  updateTransactionCount(count) {
    this.lastTransactionCount = count;
  }
}

// Export singleton instance
export const transactionTrackingService = new TransactionTrackingService(); 