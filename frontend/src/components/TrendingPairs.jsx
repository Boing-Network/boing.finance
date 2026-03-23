import React from 'react';
import { Link } from 'react-router-dom';

const MOCK_TRENDING = [
  { pair: 'ETH/USDC', volume: '2.4M', change: '+12%' },
  { pair: 'ETH/USDT', volume: '1.8M', change: '+8%' },
  { pair: 'WETH/DAI', volume: '890K', change: '+5%' }
];

/**
 * Trending pairs / "Others also swapped" section.
 */
export default function TrendingPairs({ pairs = MOCK_TRENDING }) {
  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Trending pairs</h3>
      <ul className="space-y-2">
        {pairs.map((p, i) => (
          <li key={i}>
            <Link
              to={`/swap?pair=${encodeURIComponent(p.pair)}`}
              className="flex items-center justify-between text-sm hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{p.pair}</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {p.volume} · {p.change}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
