import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import config from '../config';
import { Helmet } from 'react-helmet-async';

// BoingAstronaut component

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('24h');

  const { data: analytics, isLoading, error } = useQuery(
    ['analytics', timeRange],
    () => fetchAnalytics(timeRange),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const fetchAnalytics = async (range) => {
    try {
      const response = await axios.get(`${config.apiUrl}/analytics?range=${range}`);
      return response.data.data || {};
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return {};
    }
  };

  const timeRanges = [
    { id: '24h', name: '24 Hours' },
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '1y', name: '1 Year' },
  ];

  return (
    <>
      <Helmet>
        <title>Analytics Dashboard - boing.finance</title>
        <meta name="description" content="Track your DeFi performance with boing.finance analytics. Real-time market data, trading insights, and portfolio analytics." />
        <meta name="keywords" content="DeFi analytics, trading analytics, market data, portfolio tracking, cryptocurrency analytics" />
        <meta property="og:title" content="Analytics Dashboard - boing.finance" />
        <meta property="og:description" content="Track your DeFi performance with boing.finance analytics." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/analytics" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Analytics Dashboard - boing.finance" />
        <meta name="twitter:description" content="Track your DeFi performance with analytics." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Analytics Dashboard
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Track trading performance, pool statistics, and market trends across all supported networks.
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Time Range</h2>
              <div className="flex flex-wrap gap-4">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRange(range.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === range.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics Content */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading analytics...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load analytics. Please try again.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Volume</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      ${analytics.totalVolume ? parseFloat(analytics.totalVolume).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all networks</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Active Users</h3>
                    <p className="text-3xl font-bold text-green-400">
                      {analytics.activeUsers ? analytics.activeUsers.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">In the last {timeRange}</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Pools</h3>
                    <p className="text-3xl font-bold text-purple-400">
                      {analytics.totalPools ? analytics.totalPools.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all networks</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Avg APY</h3>
                    <p className="text-3xl font-bold text-yellow-400">
                      {analytics.avgApy ? `${parseFloat(analytics.avgApy).toFixed(2)}%` : '0%'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all pools</p>
                  </div>
                </div>

                {/* Network Performance */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Network Performance</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analytics.networkStats ? Object.entries(analytics.networkStats).map(([network, stats]) => (
                      <div key={network} className="bg-gray-700 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">{network}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Volume:</span>
                            <span className="text-white">${parseFloat(stats.volume || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Users:</span>
                            <span className="text-white">{stats.users ? stats.users.toLocaleString() : '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Pools:</span>
                            <span className="text-white">{stats.pools ? stats.pools.toLocaleString() : '0'}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-300">No network statistics available.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Trading Pairs */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Top Trading Pairs</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Pair
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Network
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Volume
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Liquidity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            APY
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {analytics.topPairs ? analytics.topPairs.map((pair, index) => (
                          <tr key={index} className="hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-white font-bold text-sm">
                                    {pair.token0Symbol?.charAt(0) || 'T'}{pair.token1Symbol?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <span className="text-white font-medium">
                                  {pair.token0Symbol}/{pair.token1Symbol}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              {pair.network}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              ${parseFloat(pair.volume || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              ${parseFloat(pair.liquidity || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-400">
                              {pair.apy ? `${parseFloat(pair.apy).toFixed(2)}%` : '0%'}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center">
                              <p className="text-gray-300">No trading pairs data available.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* User Activity Chart Placeholder */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">User Activity</h2>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Chart visualization coming soon...</p>
                  </div>
                </div>
              </div>
            )}</div>
        </div>
      </div>
    </>
  );
}
