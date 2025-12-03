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
  const [selectedNetwork, setSelectedNetwork] = useState('all'); // For trending tokens filter

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

  // Helper function to get network name for The Graph
  const getNetworkName = (chainId) => {
    const networkMap = {
      '1': 'ethereum',
      '137': 'polygon',
      '56': 'binance-smart-chain',
      '42161': 'arbitrum',
      '10': 'optimism',
      '8453': 'base',
      '11155111': 'ethereum' // Sepolia fallback to ethereum
    };
    return networkMap[chainId] || 'ethereum';
  };

  // Fetch trending tokens - Combined CoinGecko + The Graph
  const { data: trendingTokens, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-tokens', selectedNetwork],
    queryFn: async () => {
      // If "All Networks" is selected, use CoinGecko (global trending)
      if (selectedNetwork === 'all') {
        try {
          const cgData = await coingeckoService.getTrendingTokens();
          if (cgData && cgData.coins) {
            return cgData.coins.map(coin => ({
              ...coin,
              item: {
                ...coin.item,
                network: 'all'
              }
            }));
          }
        } catch (error) {
          console.error('Error fetching CoinGecko trending:', error);
        }
      }

      // For specific networks, try The Graph
      try {
        const network = getNetworkName(selectedNetwork);
        const graphData = await theGraphService.getTrendingTokens(network, 20);
        if (graphData && graphData.tokens) {
          return graphData.tokens.map(token => ({
            item: {
              id: token.id,
              name: token.name,
              symbol: token.symbol,
              price_btc: 0,
              price_usd: token.priceUSD || 0,
              market_cap_rank: null,
              score: 0,
              network: network,
              data: {
                price: token.priceUSD || 0,
                price_change_percentage_24h: {
                  usd: token.priceChange24h || 0
                }
              }
            }
          }));
        }
      } catch (error) {
        console.error(`Error fetching The Graph trending for ${selectedNetwork}:`, error);
        // Return empty array for network-specific queries that fail
        return [];
      }

      return [];
    },
    refetchInterval: 300000, // Refetch every 5 minutes
    enabled: true, // Always enabled
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

  // Generate time-series data based on time range
  const generateTimeSeriesData = useMemo(() => {
    if (!marketData?.data?.total_volume?.usd) {
      return [];
    }

    const baseVolume = marketData.data.total_volume.usd;
    const now = Date.now();
    let dataPoints = [];
    let intervals = 0;
    let intervalMs = 0;

    switch (timeRange) {
      case '24h':
        intervals = 24;
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case '7d':
        intervals = 7;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '30d':
        intervals = 30;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '1y':
        intervals = 12;
        intervalMs = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
      default:
        intervals = 7;
        intervalMs = 24 * 60 * 60 * 1000;
    }

    // Generate data points with realistic variation
    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      const date = new Date(timestamp);
      
      // Create realistic volume variation (70% to 100% of current volume)
      const variation = 0.7 + (Math.random() * 0.3);
      const volume = baseVolume * variation * (1 - (i / intervals) * 0.2); // Gradual increase over time
      
      let label = '';
      if (timeRange === '24h') {
        label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      } else if (timeRange === '7d' || timeRange === '30d') {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      dataPoints.push({
        time: label,
        volume: volume,
        timestamp: timestamp
      });
    }

    return dataPoints;
  }, [marketData, timeRange]);

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
                    <h3 className="text-lg font-semibold text-white mb-2">24h Volume</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      {(() => {
                        const volume = analytics.totalVolume 
                          ? parseFloat(analytics.totalVolume)
                          : (dexStats?.uniswapFactories?.[0]?.totalVolumeUSD 
                            ? parseFloat(dexStats.uniswapFactories[0].totalVolumeUSD)
                            : (marketData?.data?.total_volume?.usd 
                              ? marketData.data.total_volume.usd 
                              : 0));
                        if (volume === 0) return 'N/A';
                        if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`;
                        if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
                        if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
                        return `$${volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                      })()}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {marketData?.data?.total_volume?.usd ? 'Global crypto market' : 'Across all networks'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Market Cap</h3>
                    <p className="text-3xl font-bold text-green-400">
                      {(() => {
                        const marketCap = marketData?.data?.total_market_cap?.usd 
                          ? marketData.data.total_market_cap.usd
                          : (dexStats?.uniswapFactories?.[0]?.totalLiquidityUSD 
                            ? parseFloat(dexStats.uniswapFactories[0].totalLiquidityUSD) * 2 // Estimate
                            : (analytics.totalLiquidity ? parseFloat(analytics.totalLiquidity) * 2 : 0));
                        if (marketCap === 0) return 'N/A';
                        if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
                        if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
                        if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
                        return `$${marketCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                      })()}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {marketData?.data?.total_market_cap?.usd ? 'Total crypto market' : 'Estimated'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Active Cryptocurrencies</h3>
                    <p className="text-3xl font-bold text-purple-400">
                      {marketData?.data?.active_cryptocurrencies 
                        ? marketData.data.active_cryptocurrencies.toLocaleString()
                        : (dexStats?.uniswapFactories?.[0]?.pairCount 
                          ? dexStats.uniswapFactories[0].pairCount.toLocaleString()
                          : (analytics.totalPools ? analytics.totalPools.toLocaleString() : 'N/A'))}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {marketData?.data?.active_cryptocurrencies ? 'Tracked on CoinGecko' : 'Total pools'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Markets</h3>
                    <p className="text-3xl font-bold text-yellow-400">
                      {marketData?.data?.markets 
                        ? marketData.data.markets.toLocaleString()
                        : (dexStats?.uniswapFactories?.[0]?.txCount 
                          ? dexStats.uniswapFactories[0].txCount.toLocaleString()
                          : (analytics.totalTransactions ? analytics.totalTransactions.toLocaleString() : 'N/A'))}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {marketData?.data?.markets ? 'Active trading pairs' : 'Total transactions'}
                    </p>
                  </div>
                </div>

                {/* Volume Chart */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Volume Over Time ({timeRanges.find(r => r.id === timeRange)?.name})</h2>
                    {generateTimeSeriesData.length > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                        Estimated projection based on current volume
                      </span>
                    )}
                  </div>
                  {marketLoading ? (
                    <ChartSkeleton height="300px" />
                  ) : generateTimeSeriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={generateTimeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          angle={timeRange === '1y' ? -45 : 0}
                          textAnchor={timeRange === '1y' ? 'end' : 'middle'}
                          height={timeRange === '1y' ? 80 : 30}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tickFormatter={(value) => {
                            if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                            if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                            if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                            return `$${(value / 1e3).toFixed(2)}K`;
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#F3F4F6' }}
                          formatter={(value) => `$${parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.3} 
                          name="Volume (USD)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-gray-400">Volume data not available for this time range</p>
                    </div>
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
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                          <p className="text-sm text-blue-300">
                            <span className="font-semibold">Note:</span> Market data shows current global cryptocurrency statistics. 
                            Time range selection affects the Overview chart visualization but market statistics reflect real-time data from CoinGecko.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">Total Market Cap</h3>
                            <p className="text-3xl font-bold text-blue-400">
                              {marketData.data?.total_market_cap?.usd 
                                ? (() => {
                                    const value = marketData.data.total_market_cap.usd;
                                    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                                    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                                    return `$${(value / 1e6).toFixed(2)}M`;
                                  })()
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">24h Volume</h3>
                            <p className="text-3xl font-bold text-green-400">
                              {marketData.data?.total_volume?.usd 
                                ? (() => {
                                    const value = marketData.data.total_volume.usd;
                                    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                                    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                                    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                                    return `$${(value / 1e3).toFixed(2)}K`;
                                  })()
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
                              <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                              <p className="text-sm text-white">
                                {marketData.data?.updated_at 
                                  ? (() => {
                                      // Handle timestamp - could be in seconds or milliseconds
                                      const timestamp = marketData.data.updated_at;
                                      // If timestamp is less than year 2000, it's likely in seconds
                                      const date = timestamp < 946684800000 
                                        ? new Date(timestamp * 1000) 
                                        : new Date(timestamp);
                                      // Check if date is valid
                                      if (isNaN(date.getTime())) {
                                        return 'N/A';
                                      }
                                      return date.toLocaleString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      });
                                    })()
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-300">Market data not available. Please check your connection and try again.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Trending Tokens Section */}
                {activeSection === 'trending' && (
                  <div className="space-y-6">
                    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Trending Tokens</h2>
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-gray-300">Network:</label>
                          <select
                            value={selectedNetwork}
                            onChange={(e) => setSelectedNetwork(e.target.value)}
                            className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                          >
                            <option value="all">All Networks (CoinGecko)</option>
                            <option value="1">Ethereum</option>
                            <option value="137">Polygon</option>
                            <option value="56">BSC</option>
                            <option value="42161">Arbitrum</option>
                            <option value="10">Optimism</option>
                            <option value="8453">Base</option>
                          </select>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-300">
                          <span className="font-semibold">Note:</span> Trending tokens show current popularity based on search volume and social activity. 
                          {selectedNetwork === 'all' 
                            ? ' Data from CoinGecko (all cryptocurrencies).' 
                            : ` Data from The Graph for ${getNetworkName(selectedNetwork)} network.`}
                          {' '}Time range selection does not affect trending data as it reflects current market sentiment.
                        </p>
                      </div>
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
                          <p className="text-gray-300 mb-2">
                            {selectedNetwork !== 'all' 
                              ? `No trending tokens available for ${getNetworkName(selectedNetwork)} network.` 
                              : 'No trending tokens available'}
                          </p>
                          {selectedNetwork !== 'all' && (
                            <>
                              <p className="text-sm text-gray-400 mb-4">
                                This may be due to API limitations or network-specific data unavailability.
                              </p>
                              <button
                                onClick={() => setSelectedNetwork('all')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                              >
                                Show All Networks (CoinGecko)
                              </button>
                            </>
                          )}
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
