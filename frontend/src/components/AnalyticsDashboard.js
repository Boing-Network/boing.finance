import React, { useState, useEffect } from 'react';
import { InfoTooltip } from './Tooltip';

export default function AnalyticsDashboard({ className = '' }) {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h'); // 24h, 7d, 30d, 1y

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from your analytics API
      // For demo purposes, we'll use mock data
      const mockAnalytics = {
        volume: {
          '24h': { value: 1250000, change: 12.5, trend: 'up' },
          '7d': { value: 8500000, change: -5.2, trend: 'down' },
          '30d': { value: 35000000, change: 8.7, trend: 'up' },
          '1y': { value: 420000000, change: 15.3, trend: 'up' }
        },
        liquidity: {
          '24h': { value: 45000000, change: 3.2, trend: 'up' },
          '7d': { value: 44000000, change: 1.8, trend: 'up' },
          '30d': { value: 42000000, change: -2.1, trend: 'down' },
          '1y': { value: 38000000, change: 25.6, trend: 'up' }
        },
        transactions: {
          '24h': { value: 15420, change: 18.9, trend: 'up' },
          '7d': { value: 98000, change: 12.4, trend: 'up' },
          '30d': { value: 420000, change: 7.8, trend: 'up' },
          '1y': { value: 4800000, change: 22.1, trend: 'up' }
        },
        users: {
          '24h': { value: 1250, change: 8.3, trend: 'up' },
          '7d': { value: 8900, change: 15.7, trend: 'up' },
          '30d': { value: 35000, change: 12.2, trend: 'up' },
          '1y': { value: 420000, change: 45.8, trend: 'up' }
        },
        topPairs: [
          { pair: 'ETH/USDC', volume: 450000, change: 12.5, liquidity: 15000000 },
          { pair: 'USDT/DAI', volume: 320000, change: -3.2, liquidity: 8500000 },
          { pair: 'WBTC/ETH', volume: 280000, change: 8.7, liquidity: 12000000 },
          { pair: 'UNI/ETH', volume: 180000, change: 15.3, liquidity: 6500000 },
          { pair: 'LINK/ETH', volume: 120000, change: -2.1, liquidity: 4200000 }
        ],
        recentTransactions: [
          { hash: '0x1234...5678', pair: 'ETH/USDC', amount: '2.5 ETH', value: '$5000', time: '2 min ago' },
          { hash: '0x8765...4321', pair: 'USDT/DAI', amount: '10000 USDT', value: '$10000', time: '5 min ago' },
          { hash: '0xabcd...efgh', pair: 'WBTC/ETH', amount: '0.5 WBTC', value: '$15000', time: '8 min ago' },
          { hash: '0x9876...5432', pair: 'UNI/ETH', amount: '500 UNI', value: '$2500', time: '12 min ago' }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  const formatChange = (change) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isPositive ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          )}
        </svg>
        <span>{Math.abs(change).toFixed(1)}%</span>
      </span>
    );
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'volume':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'liquidity':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'transactions':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'users':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 rounded-lg h-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <InfoTooltip content="Real-time analytics and market statistics for the DEX" />
          <button
            onClick={loadAnalytics}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Refresh analytics"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        {[
          { key: '24h', label: '24H' },
          { key: '7d', label: '7D' },
          { key: '30d', label: '30D' },
          { key: '1y', label: '1Y' }
        ].map((period) => (
          <button
            key={period.key}
            onClick={() => setTimeframe(period.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              timeframe === period.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(analytics).filter(([key]) => key !== 'topPairs' && key !== 'recentTransactions').map(([metric, data]) => (
          <div key={metric} className="bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getMetricIcon(metric)}
                <span className="text-gray-400 text-sm capitalize">{metric}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">
                {metric === 'transactions' || metric === 'users' 
                  ? data[timeframe]?.value.toLocaleString()
                  : formatNumber(data[timeframe]?.value)
                }
              </p>
              <div className="flex items-center justify-between">
                {formatChange(data[timeframe]?.change)}
                <span className="text-xs text-gray-400 capitalize">{timeframe}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Trading Pairs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-750 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Top Trading Pairs</h3>
          <div className="space-y-3">
            {analytics.topPairs?.map((pair, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium">{pair.pair}</p>
                    <p className="text-xs text-gray-400">
                      Liquidity: {formatNumber(pair.liquidity)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatNumber(pair.volume)}</p>
                  {formatChange(pair.change)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-750 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {analytics.recentTransactions?.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="text-white font-medium">{tx.pair}</p>
                    <p className="text-xs text-gray-400">{tx.amount}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{tx.value}</p>
                  <p className="text-xs text-gray-400">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-sm">Total Pairs</p>
            <p className="text-white font-bold text-lg">1,247</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Active Users (24h)</p>
            <p className="text-white font-bold text-lg">1,250</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Success Rate</p>
            <p className="text-white font-bold text-lg">99.8%</p>
          </div>
        </div>
      </div>
    </div>
  );
} 