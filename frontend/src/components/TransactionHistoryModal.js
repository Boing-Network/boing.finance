import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config.js';
import { useWalletConnection } from '../hooks/useWalletConnection';

export default function TransactionHistoryModal({ isOpen, onClose }) {
  const { account } = useWalletConnection();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, failed

  const loadTransactions = useCallback(async () => {
    if (!account) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/transactions/${account}?filter=${filter}`);
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Fallback to mock data for demo
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  }, [account, filter]);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, loadTransactions]);

  const getMockTransactions = () => {
    return [
      {
        id: '1',
        type: 'swap',
        status: 'confirmed',
        from: 'ETH',
        to: 'USDC',
        amount: '1.5',
        value: '3000',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        txHash: '0x1234...5678',
        chainId: 1
      },
      {
        id: '2',
        type: 'liquidity',
        status: 'confirmed',
        action: 'add',
        pair: 'ETH/USDC',
        amount: '500',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        txHash: '0x8765...4321',
        chainId: 1
      },
      {
        id: '3',
        type: 'bridge',
        status: 'pending',
        from: 'ETH',
        to: 'USDC',
        amount: '100',
        fromChain: 1,
        toChain: 137,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        txHash: '0xabcd...efgh',
        chainId: 1
      }
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'pending':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'failed':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'swap':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        );
      case 'liquidity':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'bridge':
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const openExplorer = (txHash, chainId) => {
    const explorers = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
      42161: 'https://arbiscan.io/tx/'
    };
    const explorer = explorers[chainId] || explorers[1];
    window.open(explorer + txHash, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[80vh] relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close transaction history"
        >
          &times;
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'swap', label: 'Swaps' },
            { key: 'liquidity', label: 'Liquidity' },
            { key: 'bridge', label: 'Bridge' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-700 rounded-lg h-20"></div>
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-gray-750 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(tx.type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">
                            {tx.type === 'swap' && `${tx.from} → ${tx.to}`}
                            {tx.type === 'liquidity' && `${tx.action} ${tx.pair}`}
                            {tx.type === 'bridge' && `${tx.from} → ${tx.to} (${tx.fromChain}→${tx.toChain})`}
                          </p>
                          <span className={`flex items-center space-x-1 ${getStatusColor(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            <span className="text-xs capitalize">{tx.status}</span>
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {tx.amount} {tx.type === 'swap' ? tx.from : ''} • {formatTime(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {tx.type === 'swap' && `$${tx.value}`}
                        {tx.type === 'liquidity' && `$${tx.amount}`}
                        {tx.type === 'bridge' && `${tx.amount} ${tx.from}`}
                      </p>
                      <button
                        onClick={() => openExplorer(tx.txHash, tx.chainId)}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View on Explorer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-lg font-semibold text-white mb-2">No Transactions</h4>
              <p className="text-gray-400">Start trading to see your transaction history here.</p>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
} 