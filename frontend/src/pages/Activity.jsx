// Unified Activity Page
// Trading activity feed with insights for swaps, liquidity, and bridge transactions

import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../contexts/WalletContext';
import { Helmet } from 'react-helmet-async';
import config from '../config';
import { NETWORKS } from '../config/networks';
import { fetchWalletActivity } from '../services/analyticsService';
import coingeckoService from '../services/coingeckoService';
import {
  filterByTimeRange,
  computeActivityStats,
  computeDailyActivity,
  formatActivityExportRow,
} from '../utils/activityInsights';
import { collectSwapCoinIds, computeTradingPnl, formatUsd } from '../utils/tradingPnl';
import { downloadCSV } from '../utils/exportData';
import LiveMarketPulse from '../components/LiveMarketPulse';
import LiveDeploymentsPanel from '../components/LiveDeploymentsPanel';
import ResearchBriefBanner from '../components/research/ResearchBriefBanner';
import WalletBehaviorPanel from '../components/research/WalletBehaviorPanel';
import toast from 'react-hot-toast';
import TransactionHistoryList from '../components/TransactionHistoryList';
import EmptyState from '../components/EmptyState';
import { ChartSkeleton } from '../components/SkeletonLoader';

const ActivityCharts = lazy(() => import('../components/ActivityCharts'));

const TIME_RANGES = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: 'all', label: 'All' },
];

export default function Activity() {
  const { account, chainId, connectWallet } = useWallet();
  const [filter, setFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');

  const fetchTransactions = useCallback(async () => {
    if (!account || !config?.apiUrl) return [];
    try {
      const res = await fetch(`${config.apiUrl}/transactions/${account}?filter=${filter}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) return data.data;
      return [];
    } catch (e) {
      console.warn('Activity: transactions API failed', e.message);
      return [];
    }
  }, [account, filter]);

  const { data: apiTxs = [], isLoading: apiLoading, refetch: refetchApi } = useQuery({
    queryKey: ['activity-transactions', account, filter],
    queryFn: fetchTransactions,
    enabled: !!account,
    staleTime: 30000,
  });

  const walletRange = timeRange === 'all' ? '1y' : timeRange === '90d' ? '1y' : timeRange;

  const { data: walletActivity } = useQuery({
    queryKey: ['activity-wallet', account, chainId, walletRange],
    queryFn: () => fetchWalletActivity(account, chainId || 1, walletRange),
    enabled: !!account,
    staleTime: 60000,
  });

  const merged = useMemo(() => {
    const byHash = new Map();
    apiTxs.forEach((tx) => byHash.set(tx.txHash, { ...tx, source: 'api' }));
    if (walletActivity?.trackedActivity?.length) {
      walletActivity.trackedActivity.forEach((a) => {
        if (a.txHash && !byHash.has(a.txHash)) {
          byHash.set(a.txHash, {
            id: `tracked_${a.txHash}`,
            type: a.action === 'swap' ? 'swap' : a.action?.startsWith('liquidity') ? 'liquidity' : 'other',
            status: 'confirmed',
            timestamp: a.timestamp,
            txHash: a.txHash,
            chainId: a.chainId,
            amount: a.amount,
            source: 'tracked',
          });
        }
      });
    }
    let list = Array.from(byHash.values());
    list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    if (chainFilter !== 'all') {
      const c = parseInt(chainFilter, 10);
      list = list.filter((tx) => tx.chainId === c);
    }
    return list;
  }, [apiTxs, walletActivity, chainFilter]);

  const filtered = useMemo(() => filterByTimeRange(merged, timeRange), [merged, timeRange]);

  const stats = useMemo(() => computeActivityStats(filtered), [filtered]);
  const dailyChart = useMemo(() => computeDailyActivity(filtered, 14), [filtered]);

  const swapTxs = useMemo(() => filtered.filter((tx) => tx.type === 'swap'), [filtered]);
  const swapCoinIds = useMemo(() => collectSwapCoinIds(swapTxs), [swapTxs]);

  const { data: swapPrices } = useQuery({
    queryKey: ['activity-swap-prices', swapCoinIds.join(',')],
    queryFn: () => coingeckoService.getSimplePrices(swapCoinIds),
    enabled: swapCoinIds.length > 0,
    staleTime: 120000,
    retry: 1,
  });

  const pnlInsights = useMemo(
    () => computeTradingPnl(swapTxs, swapPrices || {}),
    [swapTxs, swapPrices]
  );

  const handleExport = () => {
    if (!filtered.length) {
      toast.error('No activity to export');
      return;
    }
    downloadCSV(filtered.map(formatActivityExportRow), `activity-${timeRange}-${new Date().toISOString().slice(0, 10)}`);
    toast.success('Activity exported as CSV');
  };

  if (!account) {
    return (
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-3xl font-bold text-white mb-4">Activity</h1>
          <p className="text-gray-400 mb-6">Connect your wallet to view swaps, liquidity, and bridge transactions with trading insights.</p>
          <button
            onClick={() => connectWallet()}
            className="interactive-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Wallet Flow Analysis | boing.finance — Onchain Activity Research</title>
        <meta name="description" content="Wallet behavioral fingerprint, trading PnL, and onchain flow analysis across EVM chains — verifiable research output from live transaction data." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Wallet Flow Analysis</h1>
              <p className="text-gray-400 mt-1">Behavioral patterns, execution PnL & cross-chain activity</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                disabled={!filtered.length}
                className="interactive-button px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg text-white text-sm"
              >
                Export CSV
              </button>
              <button
                onClick={() => { refetchApi(); toast.success('Refreshed'); }}
                disabled={apiLoading}
                className="interactive-button px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${apiLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          <ResearchBriefBanner page="activity" compact />

          <LiveDeploymentsPanel />
          <LiveMarketPulse />

          <WalletBehaviorPanel transactions={filtered} stats={stats} />

          {/* Personal trading PnL */}
          {swapTxs.length > 0 && (
            <div className="rounded-2xl p-5 mb-6 bg-gray-800 border border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Trading Performance</h2>
                  <p className="text-xs text-gray-500">
                    Estimates use current token prices · {pnlInsights.pricedSwapCount} of {pnlInsights.swapCount} swaps priced
                  </p>
                </div>
                <Link to="/watchlist" className="text-sm text-cyan-400 hover:text-cyan-300">Watchlist →</Link>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl p-3 bg-gray-900/50 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Est. volume</p>
                  <p className="text-xl font-bold text-cyan-400">{formatUsd(pnlInsights.estimatedVolumeUsd)}</p>
                </div>
                <div className="rounded-xl p-3 bg-gray-900/50 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Est. net PnL</p>
                  <p className={`text-xl font-bold ${pnlInsights.estimatedNetPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlInsights.pricedSwapCount > 0
                      ? `${pnlInsights.estimatedNetPnlUsd >= 0 ? '+' : ''}${formatUsd(pnlInsights.estimatedNetPnlUsd)}`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-gray-900/50 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Avg swap size</p>
                  <p className="text-xl font-bold text-white">
                    {pnlInsights.pricedSwapCount > 0 ? formatUsd(pnlInsights.avgSwapSizeUsd) : '—'}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-gray-900/50 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Top pair</p>
                  <p className="text-sm font-bold text-purple-400 truncate">
                    {pnlInsights.topPair ? `${pnlInsights.topPair.pair} (${pnlInsights.topPair.count})` : '—'}
                  </p>
                  {pnlInsights.winRate != null && (
                    <p className="text-xs text-gray-500 mt-1">{pnlInsights.winRate.toFixed(0)}% favorable exits</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total transactions', value: stats.total, color: 'text-cyan-400' },
              { label: 'Swaps', value: stats.byType.swap, color: 'text-blue-400' },
              { label: 'Liquidity ops', value: stats.byType.liquidity, color: 'text-green-400' },
              { label: 'Bridges', value: stats.byType.bridge, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4 bg-gray-800 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          {filtered.length > 0 && (
            <Suspense fallback={<ChartSkeleton height="200px" />}>
              <ActivityCharts
                dailyChart={dailyChart}
                typeBreakdown={stats.typeBreakdown}
                mostActiveChain={stats.mostActiveChain}
              />
            </Suspense>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide mr-1" id="activity-type-label">
              Type
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-labelledby="activity-type-label"
            >
              {['all', 'swap', 'liquidity', 'bridge'].map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  tabIndex={filter === f ? 0 : -1}
                  onClick={() => setFilter(f)}
                  className={`interactive-button px-3 py-1.5 rounded-lg text-sm font-medium ${
                    filter === f ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide ml-2 mr-1" id="activity-period-label">
              Period
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-labelledby="activity-period-label"
            >
              {TIME_RANGES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={timeRange === id}
                  tabIndex={timeRange === id ? 0 : -1}
                  onClick={() => setTimeRange(id)}
                  className={`interactive-button px-3 py-1.5 rounded-lg text-sm font-medium ${
                    timeRange === id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm ml-auto"
              aria-label="Filter by network"
            >
              <option value="all">All Networks</option>
              {Object.entries(NETWORKS).map(([id, n]) => (
                <option key={id} value={id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            {apiLoading && merged.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto" />
                <p className="text-gray-400 mt-4">Loading activity...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="p-3 sm:p-4">
                <TransactionHistoryList
                  transactions={filtered}
                  compact
                  showStatus={false}
                />
              </div>
            ) : (
              <EmptyState
                variant="activity"
                title="No activity in this period"
                description="Your swaps, liquidity, and bridge transactions will appear here. Try a wider time range or make your first swap."
                secondaryLabel="View Swap"
                secondaryHref="/swap"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <Link to="/portfolio" className="text-cyan-400 hover:text-cyan-300">View portfolio →</Link>
            <Link to="/analytics?section=intelligence" className="text-cyan-400 hover:text-cyan-300">Onchain intelligence →</Link>
            <Link to="/watchlist" className="text-cyan-400 hover:text-cyan-300">Watchlist →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
