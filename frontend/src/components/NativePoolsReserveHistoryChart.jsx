import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { historyPointsFromRemoteIndexer, readReserveHistoryForPool } from '../services/nativeDexReserveHistory';

function shortPool(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 14) return t;
  return `${t.slice(0, 8)}…`;
}

/**
 * Reserve time series: localStorage samples (each refresh) plus optional remote indexer `history`.
 *
 * @param {{
 *   venues: import('boing-sdk').CpPoolVenue[],
 *   remoteIndexerStats: unknown,
 *   focusPoolHex?: string,
 *   reserveSampleIntervalMs?: number,
 * }} props
 */
export default function NativePoolsReserveHistoryChart({
  venues,
  remoteIndexerStats,
  focusPoolHex = '',
  reserveSampleIntervalMs = 0,
}) {
  const [idx, setIdx] = useState(0);
  const focusNorm = (focusPoolHex || '').trim().toLowerCase();

  useEffect(() => {
    setIdx((i) => {
      if (!venues.length) return 0;
      return Math.min(i, venues.length - 1);
    });
  }, [venues.length]);

  useEffect(() => {
    if (!focusNorm) return;
    const i = venues.findIndex((v) => (v.poolHex || '').trim().toLowerCase() === focusNorm);
    if (i >= 0) setIdx(i);
  }, [focusNorm, venues]);

  const selected = venues[idx] || null;
  const poolHex = selected?.poolHex || '';

  const chartData = useMemo(() => {
    if (!poolHex) return [];
    const local = readReserveHistoryForPool(poolHex);
    const remote = historyPointsFromRemoteIndexer(remoteIndexerStats, poolHex);
    const byTs = new Map();
    for (const p of remote) {
      byTs.set(p.ts, p);
    }
    for (const p of local) {
      if (!byTs.has(p.ts)) byTs.set(p.ts, p);
    }
    const rows = [];
    for (const p of byTs.values()) {
      try {
        const ra = Number(BigInt(p.ra));
        const rb = Number(BigInt(p.rb));
        if (!Number.isFinite(ra) || !Number.isFinite(rb)) continue;
        rows.push({ t: p.ts, ra, rb });
      } catch {
        /* skip bad row */
      }
    }
    return rows.sort((a, b) => a.t - b.t);
  }, [poolHex, remoteIndexerStats]);

  if (!venues.length) return null;

  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reserve history (time series)
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Local samples on each refresh
            {reserveSampleIntervalMs > 0
              ? ` and every ${Math.round(reserveSampleIntervalMs / 1000)}s while this tab is visible`
              : ''}
            ; remote indexer can supply <code className="text-[10px]">history</code> for server-backed series.
          </p>
        </div>
        {venues.length > 1 && (
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="sr-only">Pool</span>
            <select
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              className="text-xs rounded-lg border px-2 py-1.5 min-h-[40px] max-w-[220px]"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {venues.map((v, i) => (
                <option key={v.poolHex} value={i}>
                  {shortPool(v.poolHex)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {chartData.length < 2 && (
        <p className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
          At least two samples are needed. Open this tab again after another refresh, or configure an indexer with a{' '}
          <code className="text-[10px]">history</code> map.
        </p>
      )}

      {chartData.length >= 2 && (
        <div className="w-full h-[240px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => new Date(v).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} width={52} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Legend />
              <Line type="monotone" dataKey="ra" name="Reserve A" stroke="#22c55e" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="rb" name="Reserve B" stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
