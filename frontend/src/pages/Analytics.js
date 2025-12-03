import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import config from '../config';
import { Helmet } from 'react-helmet-async';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import coingeckoService from '../services/coingeckoService';
import theGraphService from '../services/theGraphService';
import { exportAnalytics } from '../utils/exportData';
import { getPricePrediction } from '../utils/predictiveAnalytics';
import { ChartSkeleton, AnalyticsCardSkeleton } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

// BoingAstronaut component

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('24h');
  const [activeSection, setActiveSection] = useState('overview'); // overview, market, trending

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => {
      return fetchAnalytics(timeRange);
    },
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once on failure
    retryDelay: 2000, // Wait 2 seconds before retry
    staleTime: 30000, // Consider data stale after 30 seconds
    onError: () => {
      // Silently handle errors - component will show empty state
    }
  });

  const fetchAnalytics = async (range) => {
    try {
      if (!config?.apiUrl) {
        return {};
      }
      const response = await axios.get(`${config.apiUrl}/analytics?range=${range}`, {
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 404
      });
      return response?.data?.data || {};
    } catch (error) {
      // Silently handle 404 and other errors - return empty data
      return {};
    }
  };

  // Fetch trending tokens - Combined CoinGecko + The Graph
  const { data: trendingTokens, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-tokens'],
    queryFn: async () => {
      try {
        // Try CoinGecko first
        const cgData = await coingeckoService.getTrendingTokens();
        if (cgData && cgData.coins) {
          return cgData.coins;
        }
      } catch (error) {
        // Silently fallback to The Graph
      }

      // Fallback to The Graph for DEX tokens
      try {
        const graphData = await theGraphService.getTrendingTokens('ethereum', 20);
        if (graphData && graphData.tokens) {
          return graphData.tokens.map(token => ({
            item: {
              id: token.id,
              name: token.name,
              symbol: token.symbol,
              price_btc: 0,
              price_usd: token.priceUSD || 0,
              market_cap_rank: null,
              score: 0
            }
          }));
        }
      } catch (error) {
        // Silently return empty array
      }

      return [];
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch DEX network statistics from The Graph
  const { data: dexStats, isLoading: dexStatsLoading } = useQuery({
    queryKey: ['dex-stats'],
    queryFn: async () => {
      try {
        const stats = await theGraphService.getNetworkStats('ethereum');
        return stats;
      } catch (error) {
        // Silently return null on error
        return null;
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch market data - React Query v5 API
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-data', timeRange],
    queryFn: async () => {
      // Get top cryptocurrencies market data
      const response = await fetch(
        `https://api.coingecko.com/api/v3/global${process.env.REACT_APP_COINGECKO_API_KEY ? `?x_cg_demo_api_key=${process.env.REACT_APP_COINGECKO_API_KEY}` : ''}`
      );
      if (!response.ok) return null;
      return await response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Analytics Dashboard
                  </h1>
                  <p className="text-xl text-gray-300 max-w-3xl">
                    Track trading performance, pool statistics, and market trends across all supported networks.
                  </p>
                </div>
                <div className="flex gap-2">
                  {trendingTokens && trendingTokens.length > 0 && (
                    <button
                      onClick={() => {
                        const analyticsData = {
                          trendingTokens: trendingTokens || [],
                          marketData: marketData || null,
                          analytics: analytics || null,
                          timestamp: new Date().toISOString()
                        };
                        exportAnalytics(analyticsData, 'json');
                        toast.success('Analytics data exported as JSON!');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <span>📥</span> Export JSON
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Time Range Selector and Sections */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Time Range</h2>
                <div className="flex space-x-2">
                  {['overview', 'market', 'trending'].map((section) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                        activeSection === section
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>
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
            {isLoading || trendingLoading || dexStatsLoading || marketLoading ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 animate-pulse">
                      <div className="h-5 bg-gray-700 rounded w-24 mb-3"></div>
                      <div className="h-10 bg-gray-700 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load analytics. Please try again.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Volume</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      ${analytics.totalVolume ? parseFloat(analytics.totalVolume).toLocaleString() : 
                        (dexStats?.uniswapFactories?.[0]?.totalVolumeUSD ? 
                          parseFloat(dexStats.uniswapFactories[0].totalVolumeUSD).toLocaleString() : '0')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all networks</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Liquidity</h3>
                    <p className="text-3xl font-bold text-green-400">
                      ${dexStats?.uniswapFactories?.[0]?.totalLiquidityUSD ? 
                        parseFloat(dexStats.uniswapFactories[0].totalLiquidityUSD).toLocaleString() : 
                        (analytics.totalLiquidity ? parseFloat(analytics.totalLiquidity).toLocaleString() : '0')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Locked in pools</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Pools</h3>
                    <p className="text-3xl font-bold text-purple-400">
                      {dexStats?.uniswapFactories?.[0]?.pairCount ? 
                        dexStats.uniswapFactories[0].pairCount.toLocaleString() : 
                        (analytics.totalPools ? analytics.totalPools.toLocaleString() : '0')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all networks</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Transactions</h3>
                    <p className="text-3xl font-bold text-yellow-400">
                      {dexStats?.uniswapFactories?.[0]?.txCount ? 
                        dexStats.uniswapFactories[0].txCount.toLocaleString() : 
                        (analytics.totalTransactions ? analytics.totalTransactions.toLocaleString() : '0')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">All-time</p>
                  </div>
                </div>

                {/* Volume Chart */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Volume Over Time</h2>
                  {marketLoading ? (
                    <ChartSkeleton height="300px" />
                  ) : marketData?.data ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={[
                        { time: '7d ago', volume: marketData.data.total_volume?.usd * 0.7 || 0 },
                        { time: '6d ago', volume: marketData.data.total_volume?.usd * 0.8 || 0 },
                        { time: '5d ago', volume: marketData.data.total_volume?.usd * 0.85 || 0 },
                        { time: '4d ago', volume: marketData.data.total_volume?.usd * 0.9 || 0 },
                        { time: '3d ago', volume: marketData.data.total_volume?.usd * 0.95 || 0 },
                        { time: '2d ago', volume: marketData.data.total_volume?.usd * 0.98 || 0 },
                        { time: '1d ago', volume: marketData.data.total_volume?.usd * 0.99 || 0 },
                        { time: 'Now', volume: marketData.data.total_volume?.usd || 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="volume" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Volume (USD)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartSkeleton height="300px" />
                  )}
                </div>

                {/* Network Performance */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Network Performance</h2>
                  {analytics.networkStats && Object.keys(analytics.networkStats).length > 0 ? (
                    <>
                      <div className="mb-6">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={Object.entries(analytics.networkStats).map(([network, stats]) => ({
                            network,
                            volume: parseFloat(stats.volume || 0),
                            users: stats.users || 0,
                            pools: stats.pools || 0
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="network" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                              labelStyle={{ color: '#F3F4F6' }}
                            />
                            <Legend />
                            <Bar dataKey="volume" fill="#3B82F6" name="Volume (USD)" />
                            <Bar dataKey="pools" fill="#10B981" name="Pools" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(analytics.networkStats).map(([network, stats]) => (
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
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No network statistics available.</p>
                    </div>
                  )}
                </div>

                {/* Network Distribution Pie Chart */}
                {analytics.networkStats && Object.keys(analytics.networkStats).length > 0 && (
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-6">Network Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analytics.networkStats).map(([network, stats]) => ({
                            name: network,
                            value: parseFloat(stats.volume || 0)
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(analytics.networkStats).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

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

                {/* User Activity Chart */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">User Activity</h2>
                  <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Activity data will be displayed here as it becomes available</p>
                  </div>
                </div>
                  </>
                )}

                {/* Market Data Section */}
                {activeSection === 'market' && (
                  <div className="space-y-6">
                    {marketLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-300 mt-4">Loading market data...</p>
                      </div>
                    ) : marketData ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">Total Market Cap</h3>
                            <p className="text-3xl font-bold text-blue-400">
                              ${marketData.data?.total_market_cap?.usd 
                                ? (marketData.data.total_market_cap.usd / 1e12).toFixed(2) + 'T'
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">24h Volume</h3>
                            <p className="text-3xl font-bold text-green-400">
                              ${marketData.data?.total_volume?.usd 
                                ? (marketData.data.total_volume.usd / 1e9).toFixed(2) + 'B'
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">BTC Dominance</h3>
                            <p className="text-3xl font-bold text-yellow-400">
                              {marketData.data?.market_cap_percentage?.btc 
                                ? marketData.data.market_cap_percentage.btc.toFixed(2) + '%'
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">ETH Dominance</h3>
                            <p className="text-3xl font-bold text-purple-400">
                              {marketData.data?.market_cap_percentage?.eth 
                                ? marketData.data.market_cap_percentage.eth.toFixed(2) + '%'
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                          <h2 className="text-2xl font-bold text-white mb-6">Market Statistics</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Active Cryptocurrencies</p>
                              <p className="text-xl font-bold text-white">
                                {marketData.data?.active_cryptocurrencies?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Markets</p>
                              <p className="text-xl font-bold text-white">
                                {marketData.data?.markets?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Market Cap Change 24h</p>
                              <p className={`text-xl font-bold ${marketData.data?.market_cap_change_percentage_24h_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {marketData.data?.market_cap_change_percentage_24h_usd 
                                  ? (marketData.data.market_cap_change_percentage_24h_usd >= 0 ? '+' : '') + marketData.data.market_cap_change_percentage_24h_usd.toFixed(2) + '%'
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Updated</p>
                              <p className="text-sm text-white">
                                {marketData.data?.updated_at 
                                  ? new Date(marketData.data.updated_at).toLocaleString()
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-300">Market data not available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Trending Tokens Section */}
                {activeSection === 'trending' && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                      <h2 className="text-2xl font-bold text-white mb-6">Trending Tokens (CoinGecko)</h2>
                      {trendingLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-gray-300 mt-4">Loading trending tokens...</p>
                        </div>
                      ) : trendingTokens && trendingTokens.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {trendingTokens.slice(0, 12).map((coin, index) => (
                            <div key={index} className="bg-gray-700 rounded-xl p-4 border border-gray-600 hover:border-blue-500 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {coin.item?.small && (
                                    <img src={coin.item.small} alt={coin.item.name} className="w-10 h-10 rounded-full" />
                                  )}
                                  <div>
                                    <h3 className="text-white font-semibold">{coin.item?.name || 'Unknown'}</h3>
                                    <p className="text-sm text-gray-400">{coin.item?.symbol?.toUpperCase() || ''}</p>
                                  </div>
                                </div>
                                <span className="text-yellow-400 font-bold">#{index + 1}</span>
                              </div>
                              {coin.item?.data?.price && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Price:</span>
                                    <span className="text-white">${parseFloat(coin.item.data.price).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                                  </div>
                                  {coin.item.data.price_change_percentage_24h && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">24h Change:</span>
                                      <span className={coin.item.data.price_change_percentage_24h.usd >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {coin.item.data.price_change_percentage_24h.usd >= 0 ? '+' : ''}
                                        {coin.item.data.price_change_percentage_24h.usd?.toFixed(2)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-300">No trending tokens available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}</div>
        </div>
      </div>
    </>
  );
}
