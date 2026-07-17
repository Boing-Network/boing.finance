import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import config from '../config';

function formatVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatChange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function normalizePairs(topPairs) {
  return (topPairs || [])
    .slice(0, 5)
    .map((p) => {
      const pair =
        p.pair ||
        p.name ||
        [p.token0Symbol || p.token0?.symbol, p.token1Symbol || p.token1?.symbol]
          .filter(Boolean)
          .join('/') ||
        null;
      if (!pair) return null;
      return {
        pair,
        volume: formatVolume(p.volume24h ?? p.volume ?? p.tvl),
        change: formatChange(p.priceChange24h ?? p.change24h ?? p.change),
      };
    })
    .filter(Boolean);
}

/**
 * Trending pairs sidebar. Shows live analytics pairs when available; otherwise hides.
 */
export default function TrendingPairs({ pairs: pairsProp }) {
  const { data: fetched = [] } = useQuery({
    queryKey: ['trending-pairs-sidebar'],
    queryFn: async () => {
      const base = (config.apiUrl || '').replace(/\/$/, '');
      const res = await fetch(`${base}/analytics?range=24h`);
      if (!res.ok) return [];
      const json = await res.json();
      const topPairs = json?.data?.topPairs || json?.topPairs || json?.data?.pairs || [];
      return normalizePairs(topPairs);
    },
    enabled: pairsProp == null,
    staleTime: 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const pairs = pairsProp != null ? normalizePairs(pairsProp) : fetched;
  if (!pairs.length) return null;

  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Trending pairs</h3>
      <ul className="space-y-2">
        {pairs.map((p, i) => (
          <li key={`${p.pair}-${i}`}>
            <Link
              to={`/swap?pair=${encodeURIComponent(p.pair)}`}
              className="flex items-center justify-between text-sm hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{p.pair}</span>
              {(p.volume || p.change) && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {[p.volume, p.change].filter(Boolean).join(' · ')}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
