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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Portfolio = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock user address - replace with actual user wallet
  const userAddress = '0x1234567890123456789012345678901234567890';

  // Fetch user's liquidity positions
  const { data: liquidityPositions, isLoading: positionsLoading } = useQuery(
    ['liquidity-positions', userAddress],
    async () => {
      const response = await axios.get(`${config.apiUrl}/liquidity/positions/${userAddress}`);
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch user's swap history
  const { data: swapHistory, isLoading: swapHistoryLoading } = useQuery(
    ['swap-history', userAddress],
    async () => {
      const response = await axios.get(`${config.apiUrl}/swap/history/${userAddress}`);
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch user's liquidity events
  const { data: liquidityEvents, isLoading: eventsLoading } = useQuery(
    ['liquidity-events', userAddress],
    async () => {
      const response = await axios.get(`${config.apiUrl}/liquidity/events`, {
        params: { provider: userAddress }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Sample portfolio performance data
  const performanceData = [
    { date: '2024-01-01', value: 10000, change: 0 },
    { date: '2024-01-02', value: 10200, change: 2 },
    { date: '2024-01-03', value: 10500, change: 2.9 },
    { date: '2024-01-04', value: 10300, change: -1.9 },
    { date: '2024-01-05', value: 10800, change: 4.9 },
    { date: '2024-01-06', value: 11200, change: 3.7 },
    { date: '2024-01-07', value: 11500, change: 2.7 },
  ];

  // Calculate portfolio statistics
  const portfolioStats = React.useMemo(() => {
    const totalLiquidity = liquidityPositions?.reduce((sum, pos) => {
      const value = parseFloat(pos.amount0) * (pos.priceUsd || 1) + 
                   parseFloat(pos.amount1) * (pos.priceUsd || 1);
      return sum + value;
    }, 0) || 0;

    const totalFees = liquidityPositions?.reduce((sum, pos) => {
      return sum + (parseFloat(pos.earnedFees || 0));
    }, 0) || 0;

    const totalSwaps = swapHistory?.length || 0;
    const totalVolume = swapHistory?.reduce((sum, swap) => {
      return sum + parseFloat(swap.amountIn || 0);
    }, 0) || 0;

    return {
      totalLiquidity,
      totalFees,
      totalSwaps,
      totalVolume,
      totalValue: totalLiquidity + totalFees
    };
  }, [liquidityPositions, swapHistory]);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Portfolio</h1>
        <p className="text-gray-300">Track your positions, performance, and trading history</p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Value</h3>
          <p className="text-2xl font-bold text-white">
            ${portfolioStats.totalValue.toFixed(2)}
          </p>
          <p className="text-sm text-green-400">+5.2% this week</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Liquidity Provided</h3>
          <p className="text-2xl font-bold text-white">
            ${portfolioStats.totalLiquidity.toFixed(2)}
          </p>
          <p className="text-sm text-blue-400">Across {liquidityPositions?.length || 0} pools</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Fees Earned</h3>
          <p className="text-2xl font-bold text-white">
            ${portfolioStats.totalFees.toFixed(2)}
          </p>
          <p className="text-sm text-green-400">+12.3% this month</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Swaps</h3>
          <p className="text-2xl font-bold text-white">
            {portfolioStats.totalSwaps}
          </p>
          <p className="text-sm text-gray-400">
            ${portfolioStats.totalVolume.toFixed(2)} volume
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'positions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Liquidity Positions
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'swaps'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Swap History
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">7D</option>
                  <option value="30d">30D</option>
                  <option value="90d">90D</option>
                  <option value="1y">1Y</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
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
                    dataKey="value" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Allocation */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Asset Allocation</h3>
              {liquidityPositions?.length > 0 ? (
                <div className="space-y-4">
                  {liquidityPositions.map((position) => (
                    <div key={position.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">
                          {position.token0Symbol}/{position.token1Symbol}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {parseFloat(position.liquidityTokens).toFixed(4)} LP tokens
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">
                          ${(parseFloat(position.amount0) * (position.priceUsd || 1) + 
                             parseFloat(position.amount1) * (position.priceUsd || 1)).toFixed(2)}
                        </p>
                        <p className="text-green-400 text-sm">
                          +${parseFloat(position.earnedFees || 0).toFixed(2)} fees
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No liquidity positions found</p>
                  <p className="text-gray-400 text-sm mt-2">Add liquidity to start earning fees</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Liquidity Positions</h3>
            {positionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-2">Loading positions...</p>
              </div>
            ) : liquidityPositions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">LP Tokens</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Fees Earned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {liquidityPositions.map((position) => (
                      <tr key={position.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {position.token0Symbol}/{position.token1Symbol}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatAddress(position.pairAddress)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {parseFloat(position.liquidityTokens).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-white">
                          ${(parseFloat(position.amount0) * (position.priceUsd || 1) + 
                             parseFloat(position.amount1) * (position.priceUsd || 1)).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-green-400">
                          ${parseFloat(position.earnedFees || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => window.location.href = `/liquidity?pool=${position.pairAddress}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">No liquidity positions found</p>
                <p className="text-gray-400 text-sm mt-2">Add liquidity to start earning fees</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'swaps' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Swap History</h3>
            {swapHistoryLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-2">Loading swap history...</p>
              </div>
            ) : swapHistory?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Swap</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {swapHistory.map((swap) => (
                      <tr key={swap.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-white">{formatDate(swap.timestamp)}</div>
                          <div className="text-gray-400 text-sm">{formatTime(swap.timestamp)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">
                            {swap.tokenIn} → {swap.tokenOut}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {formatAddress(swap.txHash)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {parseFloat(swap.amountIn).toFixed(4)} → {parseFloat(swap.amountOut).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-white">
                          ${(parseFloat(swap.amountIn) * 2500).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">No swap history found</p>
                <p className="text-gray-400 text-sm mt-2">Start trading to see your swap history</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
            {eventsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-2">Loading activity...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {liquidityEvents?.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white">
                        {event.action === 'add' ? 'Added' : 'Removed'} liquidity to {event.token0Symbol}/{event.token1Symbol}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">
                        {parseFloat(event.amount0).toFixed(4)} {event.token0Symbol}
                      </p>
                      <p className="text-white">
                        {parseFloat(event.amount1).toFixed(4)} {event.token1Symbol}
                      </p>
                    </div>
                  </div>
                ))}
                {(!liquidityEvents || liquidityEvents.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-gray-300">No recent activity found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio; 