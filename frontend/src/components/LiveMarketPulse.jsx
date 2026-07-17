import React from 'react';
import { useQuery } from '@tanstack/react-query';
import coingeckoService from '../services/coingeckoService';

const PULSE_COINS = [
  { id: 'bitcoin', symbol: 'BTC', color: 'text-yellow-400' },
  { id: 'ethereum', symbol: 'ETH', color: 'text-purple-400' },
  { id: 'solana', symbol: 'SOL', color: 'text-cyan-400' },
];

function formatPrice(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

export default function LiveMarketPulse({ className = '' }) {
  const { data: prices, dataUpdatedAt, isFetching, isLoading, isError } = useQuery({
    queryKey: ['live-market-pulse'],
    queryFn: () => coingeckoService.getSimplePrices(PULSE_COINS.map((c) => c.id)),
    refetchInterval: 60000,
    staleTime: 45000,
    retry: 1,
  });

  if (isLoading && !prices) {
    return (
      <div
        className={`rounded-xl p-3 sm:p-4 mb-6 animate-pulse ${className}`}
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        aria-label="Loading live market prices"
        aria-busy="true"
      >
        <div className="h-3 w-24 rounded mb-3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !prices || Object.keys(prices).length === 0) return null;

  return (
    <div
      className={`rounded-xl p-3 sm:p-4 mb-6 ${className}`}
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      aria-label="Live market prices"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          Live markets
        </p>
        {dataUpdatedAt > 0 && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {isFetching ? 'Updating…' : `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PULSE_COINS.map(({ id, symbol, color }) => {
          const coin = prices[id];
          const change = coin?.usd_24h_change;
          const changePositive = change == null || change >= 0;
          return (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <span className={`font-bold text-sm ${color}`}>{symbol}</span>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatPrice(coin?.usd)}
                </p>
                {change != null && !Number.isNaN(change) && (
                  <p className={`text-xs font-medium ${changePositive ? 'text-green-400' : 'text-red-400'}`}>
                    {changePositive ? '+' : ''}
                    {change.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
