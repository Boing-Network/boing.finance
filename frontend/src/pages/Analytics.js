import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const { data: analytics, isLoading, error, refetch: refetchAnalytics, dataUpdatedAt } = useQuery({
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
      // Use fetch instead of axios to avoid automatic error logging
      const response = await fetch(`${config.apiUrl}/analytics?range=${range}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      // Handle 404 gracefully (expected - endpoint doesn't exist yet)
      if (response.status === 404) {
        return {};
      }
      
      if (!response.ok) {
        return {};
      }
      
      const data = await response.json();
        if (data?.success && data?.data) {
        return data.data;
      }
      return {};
    } catch (error) {
      // Log errors for debugging
      console.warn('Analytics fetch error:', error.message);
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

      // For specific networks, use backend analytics endpoint
      // selectedNetwork is already a chain ID (1, 137, etc.) from the dropdown
      try {
        const chainId = selectedNetwork === 'all' ? 1 : parseInt(selectedNetwork) || 1;
        
        // Use backend analytics endpoint instead of direct The Graph call
        const response = await fetch(`${config.apiUrl}/analytics?range=24h&networks=${chainId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data?.success && data?.data?.topPairs && data.data.topPairs.length > 0) {
            // Convert topPairs to trending tokens format
            return data.data.topPairs.slice(0, 20).map(pair => ({
              id: `${pair.token0Symbol}-${pair.token1Symbol}`,
              symbol: pair.token0Symbol,
              name: `${pair.token0Symbol}/${pair.token1Symbol}`,
              network: pair.network || getNetworkName(chainId.toString()),
              volume: pair.volume,
              liquidity: pair.liquidity,
              item: {
                id: `${pair.token0Symbol}-${pair.token1Symbol}`,
                name: `${pair.token0Symbol}/${pair.token1Symbol}`,
                symbol: pair.token0Symbol,
                price_usd: 0,
                market_cap_rank: null,
                score: parseFloat(pair.volume) || 0,
                network: pair.network || getNetworkName(chainId.toString())
              }
            }));
          }
        }
        
        // Return empty array if backend doesn't have data
        return [];
      } catch (error) {
        console.error(`Error fetching trending for network ${selectedNetwork}:`, error);
        // Return empty array for network-specific queries that fail
        return [];
      }

      return [];
    },
    refetchInterval: 300000, // Refetch every 5 minutes
    enabled: true, // Always enabled
  });

  // DEX stats are now included in the analytics response from backend
  // No need for separate query - using analytics.networkStats instead

  // Fetch price insights (predictions for BTC & ETH using existing predictive analytics)
  const { data: priceInsights, isLoading: priceInsightsLoading } = useQuery({
    queryKey: ['price-insights'],
    queryFn: async () => {
      const insights = [];
      const coins = [
        { id: 'bitcoin', symbol: 'BTC' },
        { id: 'ethereum', symbol: 'ETH' }
      ];
      for (const coin of coins) {
        try {
          const history = await coingeckoService.getPriceHistoryByCoinId(coin.id, 7);
          if (history?.prices?.length >= 7) {
            const prices = history.prices.map(([_, p]) => p).filter(Boolean);
            const prediction = getPricePrediction(prices, 7);
            insights.push({ symbol: coin.symbol, ...prediction });
          }
        } catch (err) {
          console.warn(`Price insights failed for ${coin.symbol}:`, err);
        }
      }
      return insights;
    },
    refetchInterval: 300000, // 5 min
  });

  // Fetch historical volume from CoinGecko (Bitcoin as proxy for market)
  const { data: historicalVolumeData } = useQuery({
    queryKey: ['historical-volume', timeRange],
    queryFn: async () => {
      const daysMap = { '24h': 1, '7d': 7, '30d': 30, '1y': 365 };
      const days = daysMap[timeRange] || 7;
      const chart = await coingeckoService.getMarketChartByCoinId('bitcoin', days);
      if (!chart?.total_volumes?.length) return null;
      return chart.total_volumes.map(([ts, vol]) => ({ timestamp: ts, volume: vol }));
    },
    refetchInterval: 300000,
  });

  // Fetch market data - React Query v5 API
  // Note: CoinGecko global endpoint doesn't support time ranges - it always returns current data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-data'], // Remove timeRange - CoinGecko doesn't support it
    queryFn: async () => {
      try {
        // Get top cryptocurrencies market data
        const response = await fetch(
          `https://api.coingecko.com/api/v3/global${process.env.REACT_APP_COINGECKO_API_KEY ? `?x_cg_demo_api_key=${process.env.REACT_APP_COINGECKO_API_KEY}` : ''}`
        );
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        // Silently handle errors
        return null;
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const timeRanges = [
    { id: '24h', name: '24 Hours' },
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '1y', name: '1 Year' },
  ];

  // Generate time-series data - use historical from CoinGecko when available
  const generateTimeSeriesData = useMemo(() => {
    if (historicalVolumeData?.length > 0) {
      const step = Math.max(1, Math.floor(historicalVolumeData.length / (timeRange === '24h' ? 24 : timeRange === '1y' ? 12 : 7)));
      return historicalVolumeData
        .filter((_, i) => i % step === 0 || i === historicalVolumeData.length - 1)
        .map(({ timestamp, volume }) => {
          const date = new Date(timestamp);
          let label = timeRange === '24h'
            ? date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
            : (timeRange === '7d' || timeRange === '30d')
              ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return { time: label, volume, timestamp };
        });
    }
    if (!marketData?.data?.total_volume?.usd) return [];

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
  }, [marketData, timeRange, historicalVolumeData]);

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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Analytics Dashboard
                  </h1>
                  <p className="text-xl text-gray-300 max-w-3xl">
                    Track trading performance, pool statistics, and market trends across all supported networks.
                  </p>
                  {dataUpdatedAt > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => refetchAnalytics()}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    title="Refresh data"
                  >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  {(trendingTokens?.length > 0 || analytics || marketData) && (
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
              <div className="flex items-center justify-between mb-4">
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
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Note:</span> Time range affects the volume chart in Overview. 
                  Market and trending data show real-time info. Historical volume uses CoinGecko (Bitcoin as proxy).
                </p>
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
            {isLoading || trendingLoading || marketLoading ? (
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
                        // Try backend analytics first, then CoinGecko market data
                        let volume = 0;
                        if (analytics?.totalVolume && parseFloat(analytics.totalVolume) > 0) {
                          volume = parseFloat(analytics.totalVolume);
                        } else if (marketData?.data?.total_volume?.usd) {
                          volume = marketData.data.total_volume.usd;
                        }
                        
                        if (volume === 0 || isNaN(volume)) return 'N/A';
                        if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`;
                        if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
                        if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
                        return `$${volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                      })()}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {analytics?.totalVolume && parseFloat(analytics.totalVolume) > 0 
                        ? 'DEX volume (backend API)' 
                        : (marketData?.data?.total_volume?.usd ? 'Global crypto market (CoinGecko)' : 'Loading...')}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Market Cap</h3>
                    <p className="text-3xl font-bold text-green-400">
                      {(() => {
                        const marketCap = marketData?.data?.total_market_cap?.usd 
                          ? marketData.data.total_market_cap.usd
                          : (analytics?.marketCap 
                            ? parseFloat(analytics.marketCap)
                            : (analytics?.totalLiquidity ? parseFloat(analytics.totalLiquidity) * 2 : 0));
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
                        : (analytics?.activeCryptocurrencies 
                          ? analytics.activeCryptocurrencies.toLocaleString()
                          : (analytics?.totalPools ? analytics.totalPools.toLocaleString() : 'N/A'))}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {marketData?.data?.active_cryptocurrencies ? 'Tracked on CoinGecko' : (analytics?.activeCryptocurrencies ? 'From backend API' : 'Total pools')}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Markets</h3>
                    <p className="text-3xl font-bold text-yellow-400">
                      {marketData?.data?.markets 
                        ? marketData.data.markets.toLocaleString()
                        : (analytics?.markets 
                          ? analytics.markets.toLocaleString()
                          : (analytics?.totalTransactions ? analytics.totalTransactions.toLocaleString() : 'N/A'))}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {marketData?.data?.markets ? 'Active trading pairs (CoinGecko)' : (analytics?.markets ? 'Markets (backend API)' : 'Total transactions')}
                    </p>
                  </div>
                </div>

                {/* Price Insights - 7-Day Forecast (Predictive Analytics) */}
                {priceInsights && priceInsights.length > 0 && (
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Price Insights (7-Day Forecast)</h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Trend-based predictions from historical data. Not financial advice — use with caution.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {priceInsights.map((insight) => (
                        <div key={insight.symbol} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-white font-semibold">{insight.symbol}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              insight.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                              insight.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {insight.trend?.toUpperCase() || 'NEUTRAL'}
                            </span>
                          </div>
                          {insight.predictedPrice != null && insight.currentPrice && (
                            <>
                              <div className="text-sm text-gray-300">
                                Current: ${insight.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-sm text-blue-300 mt-1">
                                Est. 7d: ${insight.predictedPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                            </>
                          )}
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <span>Confidence: {insight.confidence || 0}%</span>
                            {insight.volatility != null && <span>Volatility: {insight.volatility}%</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volume Chart */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold text-white">Volume Over Time ({timeRanges.find(r => r.id === timeRange)?.name})</h2>
                    </div>
                    {generateTimeSeriesData.length > 0 && (
                      <div className={`${(analytics?.source === 'historical' || historicalVolumeData?.length) ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} rounded-lg p-3 mb-4`}>
                        <p className={`text-sm ${(analytics?.source === 'historical' || historicalVolumeData?.length) ? 'text-green-300' : 'text-yellow-300'}`}>
                          <span className="font-semibold">{(analytics?.source === 'historical' || historicalVolumeData?.length) ? '✅ Historical Data:' : '⚠️ Estimated Data:'}</span> {
                            analytics?.source === 'historical'
                              ? 'This chart shows actual historical volume data from the backend API.'
                              : historicalVolumeData?.length
                                ? 'This chart shows Bitcoin trading volume from CoinGecko (proxy for market volume).'
                                : 'This chart shows estimated volume projections based on current 24h volume from CoinGecko.'
                          }
                        </p>
                      </div>
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
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-center px-4">
                      <p className="text-gray-400">Volume data not available for this time range</p>
                      <button
                        onClick={() => refetchAnalytics()}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Try refreshing
                      </button>
                    </div>
                  )}
                </div>

                {/* Network Performance */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Network Performance</h2>
                  {analytics?.networkStats && typeof analytics.networkStats === 'object' && Object.keys(analytics.networkStats).length > 0 ? (
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
                    <div className="text-center py-12">
                      <div className="bg-gray-700/50 rounded-lg p-6 max-w-md mx-auto">
                        <p className="text-gray-300 mb-2">Network Performance Data Unavailable</p>
                        <p className="text-sm text-gray-400 mb-4">
                          {analytics && Object.keys(analytics).length > 0 
                            ? 'Network statistics are being fetched from the backend. If this persists, the backend may not have collected data yet.'
                            : 'Network-specific statistics require backend API integration. The backend endpoint is available but may need time to collect initial data.'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Data source: Backend analytics API (collects data hourly from The Graph and CoinGecko)
                        </p>
                      </div>
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
                  {analytics?.topPairs && Array.isArray(analytics.topPairs) && analytics.topPairs.length > 0 ? (
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
                          {analytics.topPairs.map((pair, index) => (
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-700/50 rounded-lg p-6 max-w-md mx-auto">
                        <p className="text-gray-300 mb-2">Trading Pairs Data Unavailable</p>
                        <p className="text-sm text-gray-400 mb-4">
                          {analytics && Object.keys(analytics).length > 0 
                            ? 'Top trading pairs are being fetched from the backend. If this persists, the backend may not have collected data yet or The Graph API may be rate-limited.'
                            : 'Top trading pairs data requires backend API integration. The backend endpoint is available but may need time to collect initial data.'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Data source: Backend analytics API (collects data hourly from The Graph)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Activity Chart */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">User Activity</h2>
                  {analytics?.userActivity && analytics.userActivity.totalActions > 0 ? (
                    <>
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Total Actions</p>
                            <p className="text-3xl font-bold text-white">
                              {analytics.userActivity.totalActions.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Unique Users</p>
                            <p className="text-3xl font-bold text-white">
                              {analytics.userActivity.uniqueUsers.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Activity Types</p>
                            <p className="text-3xl font-bold text-white">
                              {Object.keys(analytics.userActivity.byType || {}).length}
                            </p>
                          </div>
                        </div>
                        {analytics.userActivity.byType && Object.keys(analytics.userActivity.byType).length > 0 && (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Object.entries(analytics.userActivity.byType).map(([action, count]) => ({
                              action: action.replace('_', ' ').toUpperCase(),
                              count: Array.isArray(count) ? count.length : count
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="action" stroke="#9CA3AF" />
                              <YAxis stroke="#9CA3AF" />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                labelStyle={{ color: '#F3F4F6' }}
                              />
                              <Legend />
                              <Bar dataKey="count" fill="#8B5CF6" name="Actions" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      {analytics.userActivity.recentActivity && analytics.userActivity.recentActivity.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                          <div className="space-y-2">
                            {analytics.userActivity.recentActivity.slice(0, 10).map((activity, index) => (
                              <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                  <span className="text-white font-medium capitalize">{activity.action?.replace('_', ' ') || 'Unknown'}</span>
                                  {activity.chainId && (
                                    <span className="text-gray-400 text-sm ml-2">Chain: {activity.chainId}</span>
                                  )}
                                </div>
                                <span className="text-gray-400 text-sm">
                                  {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-700/50 rounded-lg p-6 max-w-md mx-auto">
                        <p className="text-gray-300 mb-2">User Activity Data Unavailable</p>
                        <p className="text-sm text-gray-400 mb-4">
                          {analytics && Object.keys(analytics).length > 0
                            ? 'No user activity has been tracked yet. Activity will appear once users perform actions (swaps, liquidity operations, etc.).'
                            : 'User activity metrics require backend API integration. The system tracks user interactions and on-chain transactions.'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Data source: Backend analytics API (tracks user interactions and on-chain transactions)
                        </p>
                      </div>
                    </div>
                  )}
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
                          <label htmlFor="network-selector" className="text-sm text-gray-300">Network:</label>
                          <select
                            id="network-selector"
                            name="network-selector"
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
                            : ` Data from backend API for ${getNetworkName(selectedNetwork)} network.`}
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
