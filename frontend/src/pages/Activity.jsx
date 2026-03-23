// Unified Activity Page
// Single feed for swaps, liquidity, and bridge transactions across the app

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../contexts/WalletContext';
import { Helmet } from 'react-helmet-async';
import config from '../config';
import { NETWORKS } from '../config/networks';
import { fetchWalletActivity } from '../services/analyticsService';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';

const EXPLORERS = {
  1: 'https://etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  56: 'https://bscscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
};

export default function Activity() {
  const { account, chainId, connectWallet } = useWallet();
  const [filter, setFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');

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

  const { data: walletActivity } = useQuery({
    queryKey: ['activity-wallet', account, chainId],
    queryFn: () => fetchWalletActivity(account, chainId || 1, '30d'),
    enabled: !!account,
    staleTime: 60000,
  });

  const merged = React.useMemo(() => {
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

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openExplorer = (txHash, cId) => {
    const explorer = EXPLORERS[cId] || EXPLORERS[1];
    window.open(explorer + txHash, '_blank');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'swap': return <span className="text-blue-400">⇄</span>;
      case 'liquidity': return <span className="text-green-400">+</span>;
      case 'bridge': return <span className="text-purple-400">⇌</span>;
      default: return <span className="text-gray-400">•</span>;
    }
  };

  const getTypeLabel = (tx) => {
    if (tx.type === 'swap') return `Swap ${tx.from || ''} → ${tx.to || ''}`;
    if (tx.type === 'liquidity') return `${tx.action === 'add' ? 'Add' : 'Remove'} Liquidity`;
    if (tx.type === 'bridge') return `Bridge ${tx.fromChain || ''} → ${tx.toChain || ''}`;
    return tx.action || tx.type || 'Activity';
  };

  if (!account) {
    return (
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center py-16">
          <h1 className="text-3xl font-bold text-white mb-4">Activity</h1>
          <p className="text-gray-400 mb-6">Connect your wallet to view swaps, liquidity, and bridge transactions.</p>
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
        <title>Activity | boing.finance — Swaps, Liquidity & Bridge History</title>
        <meta name="description" content="View your swap, liquidity, and bridge history on EVM and Solana. Full transaction history with boing.finance." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-white">Activity</h1>
            <button
              onClick={() => { refetchApi(); toast.success('Refreshed'); }}
              disabled={apiLoading}
              className="interactive-button px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <svg className={`w-4 h-4 ${apiLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <p className="text-gray-400 mb-6">
            Swaps, liquidity, and bridge transactions in one place.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'swap', 'liquidity', 'bridge'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`interactive-button px-4 py-2 rounded-lg font-medium ${
                  filter === f ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm"
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
            ) : merged.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {merged.map((tx) => (
                  <li key={tx.id || tx.txHash} className="interactive-card p-4 hover:bg-gray-700/50 flex items-center justify-between gap-4 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-lg">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{getTypeLabel(tx)}</p>
                        <p className="text-sm text-gray-400">
                          {tx.amount && typeof tx.amount === 'string' ? tx.amount : ''} • {formatTime(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{NETWORKS[tx.chainId]?.name || `Chain ${tx.chainId}`}</span>
                      <button
                        onClick={() => openExplorer(tx.txHash, tx.chainId)}
                        className="interactive-link text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                variant="activity"
                title="No activity yet"
                description="Your swaps, liquidity, and bridge transactions will appear here. Try making a swap or adding liquidity."
                secondaryLabel="View Swap"
                secondaryHref="/swap"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
