import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import config from '../config';
import { Helmet } from 'react-helmet-async';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import coingeckoService from '../services/coingeckoService';
import { getDexVolumeChart } from '../services/defillamaService';
import { getDexVolume24h } from '../services/geckoterminalService';
import { getCryptoNews } from '../services/newsService';
import { exportAnalytics } from '../utils/exportData';
import { getPricePrediction } from '../utils/predictiveAnalytics';
import { ChartSkeleton } from '../components/SkeletonLoader';
import MetricTooltip from '../components/Tooltip';
import { downloadCSV } from '../utils/exportData';
import toast from 'react-hot-toast';
import { CHART_COLORS } from '../theme/designTokens';

// BoingAstronaut component

const STORAGE_KEYS = { timeRange: 'boing_analytics_timeRange', section: 'boing_analytics_section' };
function getStored(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v || fallback;
  } catch {
    return fallback;
  }
}

export default function Analytics() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState(() => getStored(STORAGE_KEYS.timeRange, '24h'));
  const [activeSection, setActiveSection] = useState(() => getStored(STORAGE_KEYS.section, 'overview'));
  const [overviewStep, setOverviewStep] = useState(1); // Wizard sub-steps for Overview
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.timeRange, timeRange);
    } catch (_) {}
  }, [timeRange]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.section, activeSection);
    } catch (_) {}
  }, [activeSection]);

  // Reset overview step when switching sections
  useEffect(() => {
    if (activeSection !== 'overview') setOverviewStep(1);
  }, [activeSection]);

  const { data: analytics, isLoading, error, isFetching: analyticsFetching, dataUpdatedAt } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => fetchAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 2000,
    staleTime: 0, // Always refetch when switching time range (fixes toggle bug)
    onError: () => {},
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

  // Fetch trending NFT collections (CoinGecko - requires Pro API for /nfts/markets; 401 on free tier)
  const hasCoinGeckoPro = !!process.env.REACT_APP_COINGECKO_API_KEY;
  const { data: trendingNfts = [] } = useQuery({
    queryKey: ['trending-nfts'],
    queryFn: () => coingeckoService.getNftMarkets(8),
    staleTime: 300000,
    retry: 0,
    enabled: hasCoinGeckoPro,
  });

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

    },
    refetchInterval: 300000, // Refetch every 5 minutes
    enabled: true, // Always enabled
  });

  // DEX stats are now included in the analytics response from backend
  // No need for separate query - using analytics.networkStats instead

  // Fetch price insights (predictions for BTC & ETH using existing predictive analytics)
  const { data: priceInsights } = useQuery({
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

  // DefiLlama: reliable DEX volume (primary source, with retry + cache in service)
  const { data: defiLlamaVolumeData, isFetched: defiLlamaFetched } = useQuery({
    queryKey: ['defillama-dex-volume', timeRange],
    queryFn: () => getDexVolumeChart(timeRange),
    refetchInterval: 300000,
    staleTime: 0, // Always refetch when switching time range
    retry: 2,
    retryDelay: 1500,
  });

  // Second DEX source: GeckoTerminal 24h volume (for fallback + cross-check)
  const { data: geckoTerminalVolume } = useQuery({
    queryKey: ['geckoterminal-dex-volume24h'],
    queryFn: getDexVolume24h,
    refetchInterval: 300000,
    staleTime: 120000,
    retry: 2,
    retryDelay: 1500,
  });

  // Fallback: CoinGecko Bitcoin volume - ONLY when DefiLlama unavailable (reduces 429 rate limits)
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
    retry: 1,
    retryDelay: 5000,
    staleTime: 0, // Always refetch when switching time range
    enabled: defiLlamaFetched && (!defiLlamaVolumeData || defiLlamaVolumeData.length === 0),
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

  // Crypto/DeFi news (NewsAPI.org - only when REACT_APP_NEWSAPI_KEY is set)
  const hasNewsApiKey = !!process.env.REACT_APP_NEWSAPI_KEY;
  const { data: cryptoNews } = useQuery({
    queryKey: ['crypto-news'],
    queryFn: () => getCryptoNews({ pageSize: 8, sortBy: 'publishedAt' }),
    staleTime: 10 * 60 * 1000, // 10 min
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
    enabled: hasNewsApiKey,
  });

  // Platform activity (backend analytics dashboard - same worker, /analytics path)
  const analyticsBase = config?.apiUrl ? new URL(config.apiUrl).origin : '';
  const { data: dashboardStats } = useQuery({
    queryKey: ['analytics-dashboard', timeRange],
    queryFn: async () => {
      if (!analyticsBase) return null;
      try {
        const res = await fetch(`${analyticsBase}/analytics/dashboard?timeRange=${timeRange}`, {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => null);
        return json?.success && json?.data ? json.data : null;
      } catch {
        return null;
      }
    },
    staleTime: 60000,
    retry: 0,
  });

  const sections = ['overview', 'market', 'trending'];
  const handleSectionKeyDown = (e) => {
    const i = sections.indexOf(activeSection);
    if (e.key === 'ArrowRight' && i < sections.length - 1) {
      e.preventDefault();
      setActiveSection(sections[i + 1]);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      setActiveSection(sections[i - 1]);
    }
  };

  const timeRanges = [
    { id: '24h', name: '24 Hours' },
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '1y', name: '1 Year' },
  ];

  // Generate time-series data: DefiLlama (real DEX volume) first, then CoinGecko fallback. No synthetic data.
  const generateTimeSeriesData = useMemo(() => {
    if (defiLlamaVolumeData?.length > 0) {
      return defiLlamaVolumeData;
    }
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
    return [];
  }, [timeRange, defiLlamaVolumeData, historicalVolumeData]);

  const volumeChartSource = defiLlamaVolumeData?.length ? 'defillama' : historicalVolumeData?.length ? 'coingecko' : null;

  return (
    <>
      <Helmet>
        <title>Analytics | boing.finance — Market Data & DeFi Insights</title>
        <meta name="description" content="Real-time DeFi analytics on EVM and Solana. Market data, pool stats, and trading insights with boing.finance." />
        <meta name="keywords" content="DeFi analytics, market data, boing finance, EVM, Solana, pool stats" />
        <meta property="og:title" content="Analytics | boing.finance" />
        <meta property="og:description" content="Real-time market data and DeFi insights on EVM and Solana." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/analytics" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Analytics | boing.finance" />
        <meta name="twitter:description" content="DeFi analytics and market data on EVM and Solana." />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div
        className="relative min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Compact */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Analytics
                  </h1>
                  <p className="text-sm sm:text-base mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Market trends and trading insights
                  </p>
                  {dataUpdatedAt > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={async () => {
                      try {
                        await Promise.all([
                          queryClient.invalidateQueries({ queryKey: ['analytics'] }),
                          queryClient.invalidateQueries({ queryKey: ['trending-tokens'] }),
                          queryClient.invalidateQueries({ queryKey: ['historical-volume'] }),
                          queryClient.invalidateQueries({ queryKey: ['market-data'] }),
                          queryClient.invalidateQueries({ queryKey: ['price-insights'] })
                        ]);
                        toast.success('Analytics data refreshed');
                      } catch (e) {
                        toast.error('Refresh failed');
                      }
                    }}
                    disabled={analyticsFetching || isLoading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    title="Refresh all analytics data"
                  >
                    <svg className={`w-4 h-4 ${(analyticsFetching || isLoading) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Unified Toolbar - Sections + Time Range */}
            <div
              className="rounded-2xl shadow-xl p-4 sm:p-5 mb-6"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics sections" onKeyDown={handleSectionKeyDown}>
                  {sections.map((section) => (
                    <button
                      key={section}
                      type="button"
                      role="tab"
                      aria-selected={activeSection === section}
                      aria-controls={`analytics-panel-${section}`}
                      id={`tab-${section}`}
                      tabIndex={activeSection === section ? 0 : -1}
                      onClick={() => setActiveSection(section)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                        activeSection === section
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {timeRanges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setTimeRange(range.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        timeRange === range.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {range.id === '24h' ? '24h' : range.id === '7d' ? '7d' : range.id === '30d' ? '30d' : '1y'}
                    </button>
                  ))}
                  <MetricTooltip content="Time range affects Volume chart and User Activity. Key metrics use real-time or 24h data.">
                    <span className="text-gray-500 cursor-help ml-1 text-sm">ⓘ</span>
                  </MetricTooltip>
                </div>
              </div>
            </div>

            {/* Analytics Content - section-level loading; no full-page block */}
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load analytics. Please try again.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <div id="analytics-panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
                  {/* Wizard step navigation for Overview */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {[
                        { step: 1, label: 'Summary', icon: '📊' },
                        { step: 2, label: 'Networks', icon: '🌐' },
                        { step: 3, label: 'Pairs', icon: '🔄' },
                        { step: 4, label: 'Activity', icon: '📈' },
                        { step: 5, label: 'Insights', icon: '💡' },
                      ].map(({ step, label, icon }) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setOverviewStep(step)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            overviewStep === step ? 'bg-blue-500 text-white' : 'hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {overviewStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setOverviewStep(overviewStep - 1)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white"
                        >
                          ← Previous
                        </button>
                      )}
                      {overviewStep < 5 && (
                        <button
                          type="button"
                          onClick={() => setOverviewStep(overviewStep + 1)}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Next →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 1: Key Metrics + Volume Chart */}
                  {(overviewStep === 1) && <>
                {/* Key Metrics - Compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {isLoading && !marketData?.data ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-xl p-4 border animate-pulse" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        <div className="h-4 rounded w-16 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                        <div className="h-8 rounded w-24 mb-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                      </div>
                    ))
                  ) : (
                  <>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <MetricTooltip content={`Total ${timeRange === '24h' ? '24h' : timeRange === '7d' ? '7-day' : timeRange === '30d' ? '30-day' : '1-year'} DEX volume. Sources: DefiLlama, GeckoTerminal, or CoinGecko.`}>
                      <h3 className="text-sm font-medium mb-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        Volume ({timeRange})
                        <span className="text-gray-500 cursor-help text-xs">ⓘ</span>
                      </h3>
                    </MetricTooltip>
                    <p className="text-xl sm:text-2xl font-bold text-blue-400">
                      {(() => {
                        let volume = 0;
                        if (analytics?.totalVolume && parseFloat(analytics.totalVolume) > 0 && timeRange === '24h') {
                          volume = parseFloat(analytics.totalVolume);
                        } else if (defiLlamaVolumeData?.length) {
                          // For 7d/30d/1y: sum all points for period total; for 24h use last point
                          if (timeRange === '24h') {
                            const last = defiLlamaVolumeData[defiLlamaVolumeData.length - 1];
                            volume = last?.volume ?? 0;
                          } else {
                            volume = defiLlamaVolumeData.reduce((sum, p) => sum + (Number(p?.volume) || 0), 0);
                          }
                        } else if (historicalVolumeData?.length) {
                          volume = timeRange === '24h'
                            ? (historicalVolumeData[historicalVolumeData.length - 1]?.volume ?? 0)
                            : historicalVolumeData.reduce((sum, p) => sum + (Number(p?.volume) || 0), 0);
                        } else if (geckoTerminalVolume?.volume24h && timeRange === '24h') {
                          volume = geckoTerminalVolume.volume24h;
                        } else if (marketData?.data?.total_volume?.usd && timeRange === '24h') {
                          volume = marketData.data.total_volume.usd;
                        }
                        if (volume === 0 || isNaN(volume)) return 'N/A';
                        if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`;
                        if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
                        if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
                        return `$${volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics?.totalVolume && parseFloat(analytics.totalVolume) > 0 
                        ? 'DEX volume (backend API)' 
                        : defiLlamaVolumeData?.length 
                          ? (geckoTerminalVolume?.volume24h ? 'DEX volume (DefiLlama, cross-checked with GeckoTerminal)' : 'DEX volume (DefiLlama)')
                          : geckoTerminalVolume?.volume24h 
                            ? 'DEX volume sample (GeckoTerminal)' 
                            : (marketData?.data?.total_volume?.usd ? 'Global crypto market (CoinGecko)' : 'Loading...')}
                    </p>
                  </div>
                  
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <MetricTooltip content="Total market capitalization. Source: CoinGecko.">
                      <h3 className="text-sm font-medium mb-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        Market Cap
                        <span className="text-gray-500 cursor-help text-xs">ⓘ</span>
                      </h3>
                    </MetricTooltip>
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
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
                    <p className="text-xs text-gray-500 mt-1">
                      {marketData?.data?.total_market_cap?.usd ? 'Total crypto market' : 'Estimated'}
                    </p>
                  </div>
                  
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <MetricTooltip content="Cryptocurrencies tracked or total pools from backend.">
                      <h3 className="text-sm font-medium mb-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        Active
                        <span className="text-gray-500 cursor-help text-xs">ⓘ</span>
                      </h3>
                    </MetricTooltip>
                    <p className="text-xl sm:text-2xl font-bold text-purple-400">
                      {marketData?.data?.active_cryptocurrencies 
                        ? marketData.data.active_cryptocurrencies.toLocaleString()
                        : (analytics?.activeCryptocurrencies 
                          ? analytics.activeCryptocurrencies.toLocaleString()
                          : (analytics?.totalPools ? analytics.totalPools.toLocaleString() : 'N/A'))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {marketData?.data?.active_cryptocurrencies ? 'CoinGecko' : (analytics?.activeCryptocurrencies ? 'Backend' : 'Pools')}
                    </p>
                  </div>
                  
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <MetricTooltip content="Active trading pairs (CoinGecko) or total transactions (backend).">
                      <h3 className="text-sm font-medium mb-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        Markets
                        <span className="text-gray-500 cursor-help text-xs">ⓘ</span>
                      </h3>
                    </MetricTooltip>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                      {marketData?.data?.markets 
                        ? marketData.data.markets.toLocaleString()
                        : (analytics?.markets 
                          ? analytics.markets.toLocaleString()
                          : (analytics?.totalTransactions ? analytics.totalTransactions.toLocaleString() : 'N/A'))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {marketData?.data?.markets ? 'CoinGecko' : (analytics?.markets ? 'Backend' : 'Transactions')}
                    </p>
                  </div>
                </>
                  )}
                </div>

                {!isLoading && activeSection === 'overview' && !marketData?.data && (!analytics || Object.keys(analytics).length === 0) && (
                  <div className="bg-gray-800/80 border border-gray-600 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm">
                      Live metrics will appear when market data is available. Use <strong>Refresh</strong> or switch to <strong>Market</strong> for global stats.
                    </p>
                  </div>
                )}

                {/* Volume Chart */}
                <div className="card rounded-2xl shadow-xl p-6">
                  <div className="mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-white">Volume Over Time ({timeRanges.find(r => r.id === timeRange)?.name})</h2>
                      {generateTimeSeriesData.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const rows = generateTimeSeriesData.map(({ time, volume, timestamp }) => ({
                              Time: time,
                              'Volume (USD)': Math.round(volume),
                              Timestamp: timestamp ? new Date(timestamp).toISOString() : '',
                            }));
                            downloadCSV(rows, `volume-chart-${timeRange}-${new Date().toISOString().split('T')[0]}`);
                            toast.success('Volume chart exported as CSV');
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                        >
                          Export CSV
                        </button>
                      )}
                    </div>
                    {generateTimeSeriesData.length > 0 && volumeChartSource && (
                      <div className={`${volumeChartSource === 'defillama' ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'} rounded-lg p-3 mb-4`}>
                        <p className={`text-sm ${volumeChartSource === 'defillama' ? 'text-green-300' : 'text-blue-300'}`}>
                          <span className="font-semibold">{volumeChartSource === 'defillama' ? '✅ DefiLlama (DEX volume):' : '📊 CoinGecko (Bitcoin volume):'}</span>{' '}
                          {volumeChartSource === 'defillama'
                            ? 'Real aggregated DEX trading volume across chains. Source: api.llama.fi. Cached with retries for reliability.'
                            : 'Fallback: Bitcoin trading volume from CoinGecko as market proxy.'}
                          {volumeChartSource === 'defillama' && geckoTerminalVolume?.volume24h && (
                            <span className="block mt-1 text-green-200/90">24h volume cross-checked with GeckoTerminal (second DEX source).</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {marketLoading ? (
                    <ChartSkeleton height="300px" />
                  ) : generateTimeSeriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={generateTimeSeriesData} isAnimationActive animationDuration={800} animationEasing="ease-out">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="var(--text-tertiary)"
                          angle={timeRange === '1y' ? -45 : 0}
                          textAnchor={timeRange === '1y' ? 'end' : 'middle'}
                          height={timeRange === '1y' ? 80 : 30}
                        />
                        <YAxis 
                          stroke="var(--text-tertiary)"
                          tickFormatter={(value) => {
                            if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                            if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                            if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                            return `$${(value / 1e3).toFixed(2)}K`;
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-primary)' }}
                          formatter={(value) => `$${parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="var(--accent-cyan)" 
                          fill="var(--accent-cyan)" 
                          fillOpacity={0.3} 
                          name="Volume (USD)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-center px-4">
                      <p className="text-gray-400">Volume data not available for this time range.</p>
                      <p className="text-gray-500 text-sm">We use DefiLlama (DEX volume) and CoinGecko as fallback. Try another range or refresh.</p>
                      <button
                        onClick={async () => {
                          await queryClient.invalidateQueries({ queryKey: ['analytics'] });
                          await queryClient.invalidateQueries({ queryKey: ['historical-volume'] });
                          toast.success('Refreshing...');
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Try refreshing
                      </button>
                    </div>
                  )}
                </div>
                  </>}

                  {/* Step 2: Network Performance + Network Distribution */}
                  {(overviewStep === 2) && <>
                {/* Network Performance */}
                <div className="card rounded-2xl shadow-xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-white">Network Performance</h2>
                    {analytics?.networkStats && Object.keys(analytics.networkStats).length > 0 && (
                      <button
                        onClick={() => {
                          const rows = Object.entries(analytics?.networkStats || {}).map(([network, stats]) => ({
                            Network: network,
                            'Volume (USD)': parseFloat(stats.volume || 0).toLocaleString(),
                            Users: stats.users || 0,
                            Pools: stats.pools || 0
                          }));
                          downloadCSV(rows, `network-performance-${new Date().toISOString().split('T')[0]}`);
                          toast.success('Network Performance exported as CSV!');
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
                  {analytics?.networkStats && typeof analytics.networkStats === 'object' && Object.keys(analytics.networkStats).length > 0 ? (
                    <>
                      <div className="mb-6">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={Object.entries(analytics?.networkStats || {}).map(([network, stats]) => ({
                            network,
                            volume: parseFloat(stats.volume || 0),
                            users: stats.users || 0,
                            pools: stats.pools || 0
                          }))} isAnimationActive animationDuration={600} animationEasing="ease-out">
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="network" stroke="var(--text-tertiary)" />
                            <YAxis stroke="var(--text-tertiary)" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                              labelStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Legend />
                            <Bar dataKey="volume" fill="var(--accent-cyan)" name="Volume (USD)" />
                            <Bar dataKey="pools" fill="var(--success-color)" name="Pools" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(analytics?.networkStats || {}).map(([network, stats]) => (
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
                          Data source: GeckoTerminal, DefiLlama, CoinGecko
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Network Distribution Pie Chart */}
                {analytics?.networkStats && Object.keys(analytics.networkStats).length > 0 && (
                  <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-6">Network Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart isAnimationActive animationDuration={600} animationEasing="ease-out">
                        <Pie
                          data={Object.entries(analytics?.networkStats || {}).map(([network, stats]) => ({
                            name: network,
                            value: parseFloat(stats.volume || 0)
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="var(--accent-cyan)"
                          dataKey="value"
                        >
                          {Object.keys(analytics?.networkStats || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-primary)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                  </>}

                  {/* Step 3: Top Trading Pairs */}
                  {(overviewStep === 3) && <>
                {/* Top Trading Pairs */}
                <div className="card rounded-2xl shadow-xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Top Trading Pairs</h2>
                    {analytics?.topPairs?.length > 0 && (
                      <button
                        onClick={() => {
                          const rows = (analytics?.topPairs || []).map(p => ({
                            Pair: `${p.token0Symbol}/${p.token1Symbol}`,
                            Network: p.network,
                            'Volume (USD)': parseFloat(p.volume || 0).toLocaleString(),
                            'Liquidity (USD)': parseFloat(p.liquidity || 0).toLocaleString(),
                            APY: p.apy ? `${parseFloat(p.apy).toFixed(2)}%` : '0%'
                          }));
                          downloadCSV(rows, `top-pairs-${new Date().toISOString().split('T')[0]}`);
                          toast.success('Top Pairs exported as CSV!');
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
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
                          {(analytics?.topPairs || []).map((pair, index) => (
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
                          Data source: GeckoTerminal, DefiLlama
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                  </>}

                  {/* Step 4: User Activity */}
                  {(overviewStep === 4) && <>
                {/* User Activity Chart */}
                <div className="card rounded-2xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">User Activity</h2>
                  {analytics?.userActivity && (analytics.userActivity?.totalActions ?? 0) > 0 ? (
                    <>
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Total Actions</p>
                            <p className="text-3xl font-bold text-white">
                              {(analytics?.userActivity?.totalActions ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Unique Users</p>
                            <p className="text-3xl font-bold text-white">
                              {(analytics?.userActivity?.uniqueUsers ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Activity Types</p>
                            <p className="text-3xl font-bold text-white">
                              {Object.keys(analytics?.userActivity?.byType || {}).length}
                            </p>
                          </div>
                        </div>
                        {analytics?.userActivity?.byType && Object.keys(analytics?.userActivity?.byType || {}).length > 0 && (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Object.entries(analytics?.userActivity?.byType || {}).map(([action, count]) => ({
                              action: action.replace('_', ' ').toUpperCase(),
                              count: Array.isArray(count) ? count.length : count
                            }))} isAnimationActive animationDuration={600} animationEasing="ease-out">
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                              <XAxis dataKey="action" stroke="var(--text-tertiary)" />
                              <YAxis stroke="var(--text-tertiary)" />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                labelStyle={{ color: 'var(--text-primary)' }}
                              />
                              <Legend />
                              <Bar dataKey="count" fill="var(--accent-purple)" name="Actions" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      {analytics?.userActivity?.recentActivity?.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                          <div className="space-y-2">
                            {(analytics?.userActivity?.recentActivity || []).slice(0, 10).map((activity, index) => (
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
                  </>}

                  {/* Step 5: Price Insights, News, Platform Activity */}
                  {(overviewStep === 5) && <>
                {cryptoNews?.articles?.length > 0 && (
                  <div
                    className="rounded-2xl shadow-xl p-6 mb-6"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">📰 Crypto & DeFi News</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {cryptoNews.articles.slice(0, 6).map((article, idx) => (
                        <a
                          key={idx}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-xl bg-gray-700/50 border border-gray-600 hover:border-blue-500/50 hover:bg-gray-700/70 transition-colors"
                        >
                          <p className="font-medium text-white line-clamp-2 mb-1">{article.title}</p>
                          <p className="text-xs text-gray-400">{article.source} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {dashboardStats && (
                  <div className="rounded-2xl shadow-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <h2 className="text-xl font-bold text-white mb-4">Platform Activity</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {[
                        { k: 'total_interactions', l: 'Interactions' },
                        { k: 'unique_users', l: 'Unique users' },
                        { k: 'total_searches', l: 'Searches' },
                        { k: 'page_views', l: 'Page views' },
                        { k: 'total_errors', l: 'Errors logged' },
                      ].map(({ k, l }) => (
                        <div key={k} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{l}</p>
                          <p className="text-2xl font-bold text-white">{Number(dashboardStats[k] ?? 0).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="interactive-card bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-2xl p-6 border border-purple-500/30 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">✨ Pro Analytics <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/30 text-purple-300">NFT Holders</span></h2>
                      <p className="text-sm text-gray-300 mb-2">Unlock advanced analytics when you hold Boing NFTs.</p>
                      <a href="/create-nft" className="inline-block px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium">Learn more →</a>
                    </div>
                  </div>
                </div>
                {priceInsights && priceInsights.length > 0 && (
                  <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <h2 className="text-2xl font-bold text-white mb-4">Price Insights (7-Day Forecast)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {priceInsights.map((insight) => (
                        <div key={insight.symbol} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-white font-semibold">{insight.symbol}</span>
                            <span className={`text-xs px-2 py-1 rounded ${insight.trend === 'up' ? 'bg-green-500/20 text-green-400' : insight.trend === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>{insight.trend?.toUpperCase() || 'NEUTRAL'}</span>
                          </div>
                          {insight.predictedPrice != null && insight.currentPrice && (
                            <div className="text-sm"><span className="text-gray-300">Current:</span> ${insight.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} · <span className="text-blue-300">Est. 7d:</span> ${insight.predictedPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </>}
                  </div>
                )}

                {/* Market Data Section */}
                {activeSection === 'market' && (
                  <div id="analytics-panel-market" role="tabpanel" aria-labelledby="tab-market" className="space-y-6">
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
                          <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
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
                          <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
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
                          <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                            <h3 className="text-lg font-semibold text-white mb-2">BTC Dominance</h3>
                            <p className="text-3xl font-bold text-yellow-400">
                              {marketData.data?.market_cap_percentage?.btc 
                                ? marketData.data.market_cap_percentage.btc.toFixed(2) + '%'
                                : 'N/A'}
                            </p>
                          </div>
                          <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                            <h3 className="text-lg font-semibold text-white mb-2">ETH Dominance</h3>
                            <p className="text-3xl font-bold text-purple-400">
                              {marketData.data?.market_cap_percentage?.eth 
                                ? marketData.data.market_cap_percentage.eth.toFixed(2) + '%'
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
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
                  <div id="analytics-panel-trending" role="tabpanel" aria-labelledby="tab-trending" className="space-y-6">
                    <div
                      className="rounded-2xl shadow-xl p-4 sm:p-6"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-white shrink-0">Trending Tokens</h2>
                        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
                          <label htmlFor="network-selector" className="text-sm text-gray-300 shrink-0">Network:</label>
                          <select
                            id="network-selector"
                            name="network-selector"
                            value={selectedNetwork}
                            onChange={(e) => setSelectedNetwork(e.target.value)}
                            className="w-full sm:w-auto sm:min-w-[14rem] px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
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
                          {trendingTokens.slice(0, 12).map((coin, index) => {
                            const isBackendSource = selectedNetwork !== 'all' && (coin.volume != null || coin.liquidity != null);
                            const price = coin.item?.data?.price;
                            const change24h = coin.item?.data?.price_change_percentage_24h != null
                              ? (typeof coin.item.data.price_change_percentage_24h === 'object' && coin.item.data.price_change_percentage_24h?.usd != null
                                ? coin.item.data.price_change_percentage_24h.usd
                                : Number(coin.item.data.price_change_percentage_24h))
                              : null;
                            return (
                              <div key={coin.item?.id ?? coin.id ?? index} className="interactive-card bg-gray-700 rounded-xl p-4 border border-gray-600 hover:border-blue-500">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    {coin.item?.small && (
                                      <img src={coin.item.small} alt={coin.item.name} className="w-10 h-10 rounded-full" />
                                    )}
                                    {!coin.item?.small && isBackendSource && (
                                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg font-bold text-blue-400">
                                        {(coin.item?.symbol || coin.symbol || '?').slice(0, 1)}
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="text-white font-semibold">{coin.item?.name || coin.name || 'Unknown'}</h3>
                                      <p className="text-sm text-gray-400">{(coin.item?.symbol || coin.symbol || '').toUpperCase()}</p>
                                    </div>
                                  </div>
                                  <span className="text-yellow-400 font-bold">#{index + 1}</span>
                                </div>
                                {isBackendSource ? (
                                  <div className="space-y-1 text-sm">
                                    {coin.volume != null && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">24h Volume:</span>
                                        <span className="text-white">
                                          {coin.volume >= 1e6 ? `$${(coin.volume / 1e6).toFixed(2)}M` : coin.volume >= 1e3 ? `$${(coin.volume / 1e3).toFixed(2)}K` : `$${Number(coin.volume).toLocaleString()}`}
                                        </span>
                                      </div>
                                    )}
                                    {coin.liquidity != null && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Liquidity:</span>
                                        <span className="text-white">
                                          {coin.liquidity >= 1e6 ? `$${(coin.liquidity / 1e6).toFixed(2)}M` : coin.liquidity >= 1e3 ? `$${(coin.liquidity / 1e3).toFixed(2)}K` : `$${Number(coin.liquidity).toLocaleString()}`}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : price != null && price !== '' && (
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Price:</span>
                                      <span className="text-white">${parseFloat(price).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                                    </div>
                                    {change24h != null && !Number.isNaN(change24h) && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">24h Change:</span>
                                        <span className={change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                                          {change24h >= 0 ? '+' : ''}{Number(change24h).toFixed(2)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

                    {/* Trending NFTs Section */}
                    {trendingNfts.length > 0 && (
                      <div
                    className="rounded-2xl shadow-xl p-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                        <h2 className="text-2xl font-bold text-white mb-4">Trending NFT Collections</h2>
                        <p className="text-sm text-gray-400 mb-6">Top collections by 24h volume. Source: CoinGecko.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {trendingNfts.map((nft, index) => (
                            <a
                              key={nft.id || index}
                              href={`https://www.coingecko.com/en/nft/${nft.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="interactive-card bg-gray-700 rounded-xl p-4 border border-gray-600 hover:border-purple-500 flex flex-col items-center text-center"
                            >
                              {nft.image?.small && (
                                <img src={nft.image.small} alt={nft.name} className="w-16 h-16 rounded-lg mb-2 object-cover" />
                              )}
                              <h3 className="text-white font-semibold text-sm truncate w-full">{nft.name || 'Unknown'}</h3>
                              {nft.floor_price?.usd && (
                                <p className="text-gray-400 text-xs mt-1">Floor: ${parseFloat(nft.floor_price.usd).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}</div>
        </div>
      </div>
    </>
  );
}
