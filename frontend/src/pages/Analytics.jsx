import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import config from '../config';
import { Helmet } from 'react-helmet-async';
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
import LiveMarketPulse from '../components/LiveMarketPulse';
import FearGreedPanel from '../components/FearGreedPanel';
import ResearchBriefBanner from '../components/research/ResearchBriefBanner';
import AnalyticsTopPairsView from '../components/AnalyticsTopPairsView';
import { getFearGreedIndex } from '../services/fearGreedService';
import {
  ANALYTICS_TIME_RANGES,
  isValidAnalyticsRange,
  getRangeLabel,
  getRangeShortLabel,
  getCoinGeckoMarketChartDays,
  resolveVolumeMetric,
  formatUsdVolume,
  sampleTimeSeries,
  formatChartTimeLabel,
} from '../utils/analyticsTimeRange';

const OnchainIntelligenceDashboard = lazy(() => import('../components/research/OnchainIntelligenceDashboard'));
const AnalyticsOverviewCharts = lazy(() => import('../components/AnalyticsOverviewCharts'));

const STORAGE_KEYS = { timeRange: 'boing_analytics_timeRange', section: 'boing_analytics_section' };
const STALE_1M = 60_000;

const NETWORK_NAME_BY_CHAIN = {
  '1': 'ethereum',
  '137': 'polygon',
  '56': 'binance-smart-chain',
  '42161': 'arbitrum',
  '10': 'optimism',
  '8453': 'base',
  '11155111': 'ethereum',
};

function getNetworkName(chainId) {
  return NETWORK_NAME_BY_CHAIN[chainId] || 'ethereum';
}

function getStored(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v || fallback;
  } catch {
    return fallback;
  }
}

async function fetchAnalytics(range) {
  if (!config?.apiUrl) {
    return {};
  }
  const response = await fetch(`${config.apiUrl}/analytics?range=${range}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  // Endpoint not deployed yet — treat as empty, not an error
  if (response.status === 404) {
    return {};
  }

  if (!response.ok) {
    throw new Error(`Analytics API error (${response.status})`);
  }

  const data = await response.json();
  if (data?.success && data?.data) {
    return data.data;
  }
  return {};
}

function topPairsToTrendingTokens(topPairs, networkLabel) {
  return (topPairs || []).slice(0, 20).map((pair) => {
    const network = pair.network || networkLabel;
    return {
      id: `${pair.token0Symbol}-${pair.token1Symbol}`,
      symbol: pair.token0Symbol,
      name: `${pair.token0Symbol}/${pair.token1Symbol}`,
      network,
      volume: pair.volume,
      liquidity: pair.liquidity,
      item: {
        id: `${pair.token0Symbol}-${pair.token1Symbol}`,
        name: `${pair.token0Symbol}/${pair.token1Symbol}`,
        symbol: pair.token0Symbol,
        price_usd: 0,
        market_cap_rank: null,
        score: parseFloat(pair.volume) || 0,
        network,
      },
    };
  });
}

export default function Analytics() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState(() => {
    const stored = getStored(STORAGE_KEYS.timeRange, '24h');
    return isValidAnalyticsRange(stored) ? stored : '24h';
  });
  const [activeSection, setActiveSection] = useState(() => getStored(STORAGE_KEYS.section, 'intelligence'));
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  const isIntelligence = activeSection === 'intelligence';
  const isOverview = activeSection === 'overview';
  const isMarket = activeSection === 'market';
  const isTrending = activeSection === 'trending';

  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['intelligence', 'overview', 'market', 'trending'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

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

  const {
    data: analytics,
    isLoading,
    isError: analyticsError,
    error: analyticsErrorObj,
    isFetching: analyticsFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => fetchAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 2000,
    staleTime: STALE_1M,
    placeholderData: (prev) => prev,
    enabled: isOverview || isIntelligence || isTrending,
  });

  const hasCoinGeckoPro = !!process.env.REACT_APP_COINGECKO_API_KEY;
  const { data: trendingNfts = [] } = useQuery({
    queryKey: ['trending-nfts'],
    queryFn: () => coingeckoService.getNftMarkets(8),
    staleTime: 300000,
    retry: 0,
    enabled: hasCoinGeckoPro && (isTrending || isIntelligence),
  });

  // CoinGecko global trending only — network mode derives from analytics.topPairs
  const { data: coingeckoTrending, isLoading: cgTrendingLoading } = useQuery({
    queryKey: ['trending-tokens', 'all'],
    queryFn: async () => {
      const cgData = await coingeckoService.getTrendingTokens();
      if (cgData?.coins) {
        return cgData.coins.map((coin) => ({
          ...coin,
          item: { ...coin.item, network: 'all' },
        }));
      }
      return [];
    },
    refetchInterval: 300000,
    staleTime: STALE_1M,
    enabled: (isTrending || isIntelligence) && selectedNetwork === 'all',
  });

  const networkTrendingTokens = useMemo(() => {
    if (selectedNetwork === 'all') return null;
    const label = getNetworkName(selectedNetwork);
    const pairs = analytics?.topPairs;
    if (!pairs?.length) return [];
    const filtered = pairs.filter((p) => {
      const net = String(p.network || '').toLowerCase();
      return !net || net === label || net.includes(label) || label.includes(net);
    });
    return topPairsToTrendingTokens(filtered.length ? filtered : pairs, label);
  }, [selectedNetwork, analytics?.topPairs]);

  const trendingTokens = selectedNetwork === 'all' ? coingeckoTrending : networkTrendingTokens;
  const trendingLoading =
    selectedNetwork === 'all'
      ? cgTrendingLoading
      : isLoading && !analytics;

  const { data: priceInsights } = useQuery({
    queryKey: ['price-insights'],
    queryFn: async () => {
      const insights = [];
      const coins = [
        { id: 'bitcoin', symbol: 'BTC' },
        { id: 'ethereum', symbol: 'ETH' },
      ];
      for (const coin of coins) {
        try {
          const history = await coingeckoService.getPriceHistoryByCoinId(coin.id, 7);
          if (history?.prices?.length >= 7) {
            const prices = history.prices.map(([, p]) => p).filter(Boolean);
            const prediction = getPricePrediction(prices, 7);
            insights.push({ symbol: coin.symbol, ...prediction });
          }
        } catch (err) {
          console.warn(`Price insights failed for ${coin.symbol}:`, err);
        }
      }
      return insights;
    },
    refetchInterval: 300000,
    staleTime: STALE_1M,
    enabled: isOverview,
  });

  const {
    data: defiLlamaVolumeData,
    isFetched: defiLlamaFetched,
    isLoading: defiLlamaLoading,
    isFetching: defiLlamaFetching,
  } = useQuery({
    queryKey: ['defillama-dex-volume', timeRange],
    queryFn: () => getDexVolumeChart(timeRange),
    refetchInterval: 300000,
    staleTime: STALE_1M,
    placeholderData: (prev) => prev,
    retry: 2,
    retryDelay: 1500,
    enabled: isOverview,
  });

  const { data: geckoTerminalVolume } = useQuery({
    queryKey: ['geckoterminal-dex-volume24h'],
    queryFn: getDexVolume24h,
    refetchInterval: 300000,
    staleTime: 120000,
    retry: 2,
    retryDelay: 1500,
    enabled: isOverview,
  });

  const {
    data: historicalVolumeData,
    isLoading: historicalVolumeLoading,
  } = useQuery({
    queryKey: ['historical-volume', timeRange],
    queryFn: async () => {
      const days = getCoinGeckoMarketChartDays(timeRange);
      const chart = await coingeckoService.getMarketChartByCoinId('bitcoin', days);
      if (!chart?.total_volumes?.length) return null;
      return chart.total_volumes.map(([ts, vol]) => ({ timestamp: ts, volume: vol }));
    },
    refetchInterval: 300000,
    retry: 1,
    retryDelay: 5000,
    staleTime: STALE_1M,
    placeholderData: (prev) => prev,
    enabled:
      isOverview &&
      defiLlamaFetched &&
      (!defiLlamaVolumeData || defiLlamaVolumeData.length === 0),
  });

  const volumeLoading =
    (defiLlamaLoading || defiLlamaFetching) ||
    (defiLlamaFetched &&
      (!defiLlamaVolumeData || defiLlamaVolumeData.length === 0) &&
      historicalVolumeLoading);

  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-data'],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/global${process.env.REACT_APP_COINGECKO_API_KEY ? `?x_cg_demo_api_key=${process.env.REACT_APP_COINGECKO_API_KEY}` : ''}`
      );
      if (!response.ok) {
        throw new Error(`Market data error (${response.status})`);
      }
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: STALE_1M,
    retry: 1,
    enabled: isOverview || isMarket || isIntelligence,
  });

  const hasNewsApiKey = !!process.env.REACT_APP_NEWSAPI_KEY;
  const { data: cryptoNews } = useQuery({
    queryKey: ['crypto-news'],
    queryFn: () => getCryptoNews({ pageSize: 8, sortBy: 'publishedAt' }),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
    enabled: hasNewsApiKey && (isIntelligence || isMarket),
  });

  const analyticsBase = config?.apiUrl ? new URL(config.apiUrl).origin : '';
  const { data: dashboardStats } = useQuery({
    queryKey: ['analytics-dashboard', timeRange],
    queryFn: async () => {
      if (!analyticsBase) return null;
      const res = await fetch(`${analyticsBase}/analytics/dashboard?timeRange=${timeRange}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      return json?.success && json?.data ? json.data : null;
    },
    staleTime: STALE_1M,
    placeholderData: (prev) => prev,
    retry: 0,
    enabled: isOverview,
  });

  const { data: fearGreedData = [] } = useQuery({
    queryKey: ['fear-greed-current'],
    queryFn: () => getFearGreedIndex(1),
    refetchInterval: 3600000,
    staleTime: 1800000,
    retry: 1,
    enabled: isIntelligence || isMarket,
  });

  const sections = ['intelligence', 'overview', 'market', 'trending'];
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

  const timeRanges = ANALYTICS_TIME_RANGES;

  const volumeMetric = useMemo(
    () =>
      resolveVolumeMetric({
        timeRange,
        analytics,
        defiLlamaVolumeData,
        historicalVolumeData,
        geckoTerminalVolume,
        marketData,
      }),
    [timeRange, analytics, defiLlamaVolumeData, historicalVolumeData, geckoTerminalVolume, marketData]
  );

  const generateTimeSeriesData = useMemo(() => {
    if (defiLlamaVolumeData?.length > 0) return defiLlamaVolumeData;
    if (historicalVolumeData?.length > 0) {
      return sampleTimeSeries(
        historicalVolumeData.map(({ timestamp, volume }) => ({
          time: formatChartTimeLabel(timestamp, timeRange),
          volume,
          timestamp,
        })),
        timeRange
      );
    }
    return [];
  }, [timeRange, defiLlamaVolumeData, historicalVolumeData]);

  const volumeChartSource = defiLlamaVolumeData?.length
    ? 'defillama'
    : historicalVolumeData?.length
      ? 'coingecko'
      : null;

  return (
    <>
      <Helmet>
        <title>Onchain Intelligence | boing.finance — Research & Trading Analytics</title>
        <meta name="description" content="Live onchain intelligence dashboard: liquidity migration, narrative tracking, smart-flow signals, and actionable crypto research across Solana, Base, L2s, and EVM." />
        <meta name="keywords" content="onchain intelligence, DeFi research, smart money, liquidity migration, crypto analytics, boing finance" />
        <meta property="og:title" content="Onchain Intelligence | boing.finance" />
        <meta property="og:description" content="Multi-chain research dashboard with actionable trading insights from live onchain data." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/analytics" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Analytics | boing.finance" />
        <meta name="twitter:description" content="DeFi analytics and market data on EVM and Solana." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Compact */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Onchain Intelligence
                  </h1>
                  <p className="text-sm sm:text-base mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Research dashboard · liquidity, narratives, smart flow & actionable briefs
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
                          queryClient.invalidateQueries({ queryKey: ['defillama-dex-volume'] }),
                          queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] }),
                          queryClient.invalidateQueries({ queryKey: ['market-data'] }),
                          queryClient.invalidateQueries({ queryKey: ['price-insights'] }),
                          queryClient.invalidateQueries({ queryKey: ['fear-greed-current'] }),
                          queryClient.invalidateQueries({ queryKey: ['fear-greed-history'] }),
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {section === 'intelligence' ? 'Intelligence' : section.charAt(0).toUpperCase() + section.slice(1)}
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
                      {range.shortLabel}
                    </button>
                  ))}
                  <MetricTooltip content="Time range filters volume charts, network stats, trending pairs, platform activity, and research briefs. Market cap uses live CoinGecko data.">
                    <span className="text-gray-500 cursor-help ml-1 text-sm">ⓘ</span>
                  </MetricTooltip>
                </div>
              </div>
            </div>

            <LiveMarketPulse />

            <ResearchBriefBanner page="analytics" />

            {/* Analytics Content - section-level loading; no full-page block */}
            {analyticsError ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-red-400">Failed to load analytics. Please try again.</p>
                {analyticsErrorObj?.message && (
                  <p className="text-sm text-gray-500">{analyticsErrorObj.message}</p>
                )}
                <button
                  type="button"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['analytics'] })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {activeSection === 'intelligence' && (
                  <Suspense fallback={<ChartSkeleton />}>
                    <OnchainIntelligenceDashboard
                      analytics={analytics}
                      trendingTokens={trendingTokens}
                      marketData={marketData}
                      fearGreed={fearGreedData}
                      cryptoNews={cryptoNews}
                      timeRange={timeRange}
                    />
                  </Suspense>
                )}

                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <div id="analytics-panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">

                {/* Key Metrics - Compact */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <MetricTooltip content={`Total DEX volume for ${getRangeLabel(timeRange).toLowerCase()}. 24h uses the latest daily point; longer windows sum daily volumes in range.`}>
                      <h3 className="text-sm font-medium mb-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        Volume ({getRangeShortLabel(timeRange)})
                        <span className="text-gray-500 cursor-help text-xs">ⓘ</span>
                      </h3>
                    </MetricTooltip>
                    <p className="text-xl sm:text-2xl font-bold text-blue-400">
                      {formatUsdVolume(volumeMetric.volume) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {volumeMetric.source || 'Loading...'}
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

                <Suspense fallback={<ChartSkeleton height="300px" />}>
                  <AnalyticsOverviewCharts
                    timeRange={timeRange}
                    generateTimeSeriesData={generateTimeSeriesData}
                    volumeChartSource={volumeChartSource}
                    geckoTerminalVolume={geckoTerminalVolume}
                    volumeLoading={volumeLoading}
                    analytics={analytics}
                  />
                </Suspense>

                  {/* Top Trading Pairs */}
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
                    <AnalyticsTopPairsView pairs={analytics.topPairs} />
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


                  {/* Price Insights, News, Platform Activity */}
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
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                        <FearGreedPanel />
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
                        <div className="flex flex-col filter:flex-row filter:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
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
                          {selectedNetwork === 'all'
                            ? ' Time range does not affect CoinGecko trending (current market sentiment).'
                            : ` Top pairs reflect the selected analytics range (${timeRange === 'all' ? 'all time' : timeRange}).`}
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
