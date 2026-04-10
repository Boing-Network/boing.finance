import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function shortPool(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 14) return t;
  return `${t.slice(0, 8)}…`;
}

/**
 * Uniswap-style liquidity snapshot from **current RPC reserves** (not USD TVL, not historical volume).
 * Replace with indexer-backed charts when subgraph-like data exists.
 *
 * @param {{ venues: import('boing-sdk').CpPoolVenue[] }} props
 */
export default function NativePoolsLiquidityChart({ venues }) {
  const data = useMemo(() => {
    if (!Array.isArray(venues) || venues.length === 0) return [];
    return venues.slice(0, 16).map((v) => {
      const ra = Number(v.reserveA);
      const rb = Number(v.reserveB);
      const safeA = Number.isFinite(ra) && ra >= 0 ? ra : 0;
      const safeB = Number.isFinite(rb) && rb >= 0 ? rb : 0;
      return {
        pool: shortPool(v.poolHex),
        reserveA: safeA,
        reserveB: safeB,
      };
    });
  }, [venues]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 mb-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Liquidity snapshot (raw reserves)
      </p>
      <p className="text-[11px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Integer pool units from the latest RPC hydrate — not USD TVL. Historical volume and charts need an indexer.
      </p>
      <div className="w-full h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="pool" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} interval={0} angle={-35} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} width={48} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [value, name === 'reserveA' ? 'Reserve A' : 'Reserve B']}
            />
            <Bar dataKey="reserveA" fill="#22c55e" name="reserveA" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reserveB" fill="#3b82f6" name="reserveB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
