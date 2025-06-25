import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import config from '../config';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedChain, setSelectedChain] = useState('all');

  // Fetch analytics overview
  const { data: analytics, isLoading: analyticsLoading } = useQuery(
    ['analytics-overview', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/analytics/overview`, {
        params: { chainId: selectedChain === 'all' ? null : selectedChain }
      });
      return response.data.data;
    },
    { refetchInterval: 60000 }
  );

  // Fetch swap statistics
  const { data: swapStats, isLoading: swapStatsLoading } = useQuery(
    ['swap-stats', selectedChain, timeRange],
    async () => {
      const response = await axios.get(`${config.apiUrl}/swap/stats`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          timeRange 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch recent swaps
  const { data: recentSwaps, isLoading: recentSwapsLoading } = useQuery(
    ['recent-swaps', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/swap/recent`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 10 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Sample data for charts (replace with real data from API)
  const volumeData = [
    { time: '00:00', volume: 1200000 },
    { time: '04:00', volume: 1800000 },
    { time: '08:00', volume: 2200000 },
    { time: '12:00', volume: 2800000 },
    { time: '16:00', volume: 3200000 },
    { time: '20:00', volume: 2500000 },
    { time: '24:00', volume: 1900000 },
  ];

  const tokenDistribution = [
    { name: 'ETH', value: 35, color: '#3B82F6' },
    { name: 'USDC', value: 25, color: '#10B981' },
    { name: 'USDT', value: 20, color: '#F59E0B' },
    { name: 'LINK', value: 10, color: '#8B5CF6' },
    { name: 'Others', value: 10, color: '#6B7280' },
  ];

  const topPairs = [
    { pair: 'ETH/USDC', volume: 2500000, change: 5.2 },
    { pair: 'ETH/USDT', volume: 1800000, change: -2.1 },
    { pair: 'LINK/ETH', volume: 1200000, change: 8.7 },
    { pair: 'UNI/ETH', volume: 900000, change: 3.4 },
    { pair: 'AAVE/USDC', volume: 700000, change: -1.2 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h1>
        <p className="text-gray-300">Real-time market data and trading statistics</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Chain</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Chains</option>
            <option value="1">Ethereum</option>
            <option value="137">Polygon</option>
            <option value="56">BSC</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Volume</h3>
          <p className="text-2xl font-bold text-white">
            ${analytics?.swapStats?.totalVolume ? 
              (analytics.swapStats.totalVolume / 1000000).toFixed(2) + 'M' : 
              '0.00M'
            }
          </p>
          <p className="text-sm text-green-400">+12.5% from last period</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Swaps</h3>
          <p className="text-2xl font-bold text-white">
            {analytics?.swapStats?.totalSwaps ? 
              analytics.swapStats.totalSwaps.toLocaleString() : 
              '0'
            }
          </p>
          <p className="text-sm text-green-400">+8.3% from last period</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Active Users</h3>
          <p className="text-2xl font-bold text-white">
            {analytics?.swapStats?.activeUsers ? 
              analytics.swapStats.activeUsers.toLocaleString() : 
              '0'
            }
          </p>
          <p className="text-sm text-green-400">+15.2% from last period</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Pools</h3>
          <p className="text-2xl font-bold text-white">
            {analytics?.topPools?.length || 0}
          </p>
          <p className="text-sm text-blue-400">Active liquidity pools</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Volume Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Token Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Token Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tokenDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tokenDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Pairs and Recent Swaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Trading Pairs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Trading Pairs</h3>
          <div className="space-y-4">
            {topPairs.map((pair, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">{pair.pair}</p>
                  <p className="text-gray-400 text-sm">
                    ${(pair.volume / 1000000).toFixed(2)}M volume
                  </p>
                </div>
                <div className={`text-sm font-medium ${
                  pair.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pair.change >= 0 ? '+' : ''}{pair.change}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Swaps */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Swaps</h3>
          {recentSwapsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading recent swaps...</p>
            </div>
          ) : recentSwaps?.length > 0 ? (
            <div className="space-y-3">
              {recentSwaps.slice(0, 5).map((swap) => (
                <div key={swap.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white text-sm">
                      {swap.tokenIn} → {swap.tokenOut}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(swap.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {parseFloat(swap.amountIn).toFixed(4)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      ${(parseFloat(swap.amountIn) * 2500).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300">No recent swaps found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 