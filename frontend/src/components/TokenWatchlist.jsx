// Token Watchlist Component
// Displays and manages user's watched tokens

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWatchlist, removeFromWatchlist, updateWatchlistPrice } from '../utils/tokenWatchlist';
import coingeckoService from '../services/coingeckoService';
import { NETWORKS } from '../config/networks';
import toast from 'react-hot-toast';
import OptimizedImage from './OptimizedImage';
import EmptyState from './EmptyState';

const COINGECKO_PLATFORM_BY_CHAIN = {
  1: 'ethereum',
  137: 'polygon-pos',
  56: 'binance-smart-chain',
  42161: 'arbitrum-one',
  10: 'optimistic-ethereum',
  8453: 'base',
  11155111: 'ethereum',
};

function watchlistKey(watchlist) {
  return watchlist
    .map((t) => `${(t.address || '').toLowerCase()}-${t.chainId}`)
    .sort()
    .join('|');
}

export default function TokenWatchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedChain, setSelectedChain] = useState('all');

  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  const priceQueryKey = useMemo(() => watchlistKey(watchlist), [watchlist]);

  const { data: tokenPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['watchlist-prices', priceQueryKey],
    queryFn: async () => {
      if (watchlist.length === 0) return {};

      const byPlatform = new Map();
      for (const token of watchlist) {
        const chainId = Number(token.chainId);
        const platform = COINGECKO_PLATFORM_BY_CHAIN[chainId] || 'ethereum';
        if (!byPlatform.has(platform)) byPlatform.set(platform, []);
        byPlatform.get(platform).push(token);
      }

      const prices = {};
      const results = await Promise.allSettled(
        [...byPlatform.entries()].map(async ([platform, tokens]) => {
          const addresses = tokens.map((t) => t.address).filter(Boolean);
          if (!addresses.length) return;
          const batch = await coingeckoService.getTokenPrices(addresses, platform);
          for (const token of tokens) {
            const addr = (token.address || '').toLowerCase();
            const price = batch?.[addr] || batch?.[token.address];
            if (price) {
              prices[`${token.address}-${token.chainId}`] = price;
              updateWatchlistPrice(token.address, token.chainId, price);
            }
          }
        })
      );
      results.forEach((r) => {
        if (r.status === 'rejected') console.warn('Watchlist batch price fetch failed:', r.reason);
      });
      return prices;
    },
    refetchInterval: 60000,
    staleTime: 60000,
    enabled: watchlist.length > 0,
  });

  const filteredWatchlist = watchlist.filter((token) => {
    if (selectedChain === 'all') return true;
    return token.chainId?.toString() === selectedChain;
  });

  const handleRemove = (address, chainId, symbol) => {
    if (removeFromWatchlist(address, chainId)) {
      setWatchlist(getWatchlist());
      toast.success(`${symbol} removed from watchlist`);
    }
  };

  const getPriceChange = (token) => {
    const priceKey = `${token.address}-${token.chainId}`;
    const priceData = tokenPrices?.[priceKey];
    if (priceData?.usd_24h_change != null && !Number.isNaN(priceData.usd_24h_change)) {
      return priceData.usd_24h_change;
    }
    return null;
  };

  const watchlistSummary = useMemo(() => {
    if (!watchlist.length) return null;
    const changes = filteredWatchlist
      .map((t) => getPriceChange(t))
      .filter((c) => c != null && !Number.isNaN(c));
    const avgChange = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null;
    let best = null;
    let worst = null;
    filteredWatchlist.forEach((t) => {
      const ch = getPriceChange(t);
      if (ch == null) return;
      if (!best || ch > best.change) best = { symbol: t.symbol, change: ch };
      if (!worst || ch < worst.change) worst = { symbol: t.symbol, change: ch };
    });
    return { count: watchlist.length, avgChange, best, worst };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getPriceChange depends on tokenPrices
  }, [watchlist, filteredWatchlist, tokenPrices]);

  if (watchlist.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
        <EmptyState
          variant="tokens"
          icon="⭐"
          title="No Tokens in Watchlist"
          description="Add tokens to your watchlist to track their prices"
          actionLabel="Browse Tokens"
          actionHref="/tokens"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {watchlistSummary && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl p-4 bg-gray-800 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Watching</p>
            <p className="text-2xl font-bold text-cyan-400">{watchlistSummary.count}</p>
          </div>
          <div className="rounded-xl p-4 bg-gray-800 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Avg 24h</p>
            <p
              className={`text-2xl font-bold ${
                watchlistSummary.avgChange == null
                  ? 'text-gray-400'
                  : watchlistSummary.avgChange >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
              }`}
            >
              {watchlistSummary.avgChange == null
                ? '—'
                : `${watchlistSummary.avgChange >= 0 ? '+' : ''}${watchlistSummary.avgChange.toFixed(2)}%`}
            </p>
          </div>
          <div className="rounded-xl p-4 bg-gray-800 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Best</p>
            <p className="text-sm font-bold text-green-400">
              {watchlistSummary.best
                ? `${watchlistSummary.best.symbol} +${watchlistSummary.best.change.toFixed(2)}%`
                : '—'}
            </p>
          </div>
          <div className="rounded-xl p-4 bg-gray-800 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Worst</p>
            <p className="text-sm font-bold text-red-400">
              {watchlistSummary.worst
                ? `${watchlistSummary.worst.symbol} ${watchlistSummary.worst.change.toFixed(2)}%`
                : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Token Watchlist</h2>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm"
            aria-label="Filter watchlist by network"
          >
            <option value="all">All Networks</option>
            {Object.entries(NETWORKS).map(([id, network]) => (
              <option key={id} value={id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredWatchlist.map((token, index) => {
            const priceKey = `${token.address}-${token.chainId}`;
            const priceData = tokenPrices?.[priceKey];
            const currentPrice =
              priceData?.usd ?? (typeof token.price === 'object' ? token.price?.usd : token.price) ?? 0;
            const priceChange = getPriceChange(token);
            const network = NETWORKS[token.chainId]?.name || 'Unknown';

            return (
              <div
                key={`${token.address}-${token.chainId}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {token.logo ? (
                    <OptimizedImage
                      src={token.logo}
                      alt={token.symbol}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{token.symbol?.charAt(0) || 'T'}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold">{token.symbol}</h3>
                      <span className="text-gray-400 text-sm">{token.name}</span>
                    </div>
                    <p className="text-gray-400 text-xs">{network}</p>
                  </div>
                </div>

                <div className="text-right mr-4">
                  {pricesLoading ? (
                    <div className="animate-pulse">
                      <div className="h-5 bg-gray-600 rounded w-20 mb-1" />
                      <div className="h-4 bg-gray-600 rounded w-16" />
                    </div>
                  ) : (
                    <>
                      <p className="text-white font-semibold">
                        $
                        {currentPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </p>
                      {priceChange !== null && (
                        <p className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {priceChange >= 0 ? '+' : ''}
                          {priceChange.toFixed(2)}%
                        </p>
                      )}
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(token.address, token.chainId, token.symbol)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  title="Remove from watchlist"
                  aria-label={`Remove ${token.symbol} from watchlist`}
                >
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
