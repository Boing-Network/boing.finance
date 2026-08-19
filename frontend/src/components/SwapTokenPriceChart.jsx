import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTokenMarket } from '../hooks/useTokenMarket';
import { formatUsd, formatUsdCompact } from '../services/tokenChartService';

const RANGES = [
  { id: 1, label: '1D' },
  { id: 7, label: '7D' },
  { id: 30, label: '30D' },
];

function formatAxisTime(ts, days) {
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '';
  if (days <= 1) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sourceLabel(source) {
  if (source === 'coingecko') return 'CoinGecko';
  if (source === 'geckoterminal') return 'GeckoTerminal';
  if (source === 'dexscreener') return 'DexScreener';
  return null;
}

function emptyCopy(reason) {
  if (reason === 'testnet') return 'USD charts are for mainnet markets. Testnet tokens do not have public price history.';
  if (reason === 'native-l1') return 'Boing L1 uses pool reserve charts in the trade hub, not CoinGecko USD prices.';
  return 'No public USD chart for this token yet. Charts use DexScreener for live DEX prices and CoinGecko when the asset already has a market listing.';
}

/**
 * Swap price chart for the selected token (output by default).
 */
export default function SwapTokenPriceChart({
  chain = 'evm',
  chainId,
  tokenIn,
  tokenOut,
}) {
  const [days, setDays] = useState(7);
  const [focus, setFocus] = useState(/** @type {'in' | 'out'} */ ('out'));
  const active = focus === 'in' ? tokenIn : tokenOut;

  const { data, isLoading } = useTokenMarket({
    chain,
    chainId,
    address: active?.address,
    isNative: active?.isNative,
    symbol: active?.symbol,
    days,
    enabled: Boolean(active?.symbol),
  });

  const chartData = useMemo(
    () =>
      (data?.points || []).map((row) => ({
        t: row.t,
        p: row.p,
        label: formatAxisTime(row.t, days),
      })),
    [data?.points, days]
  );

  const fillId = `swap-price-fill-${chain}-${chainId || 0}-${active?.symbol || 'tok'}-${days}`;
  const live = Boolean(data?.price);
  const change = data?.change24h;
  const up = Number(change) >= 0;
  const src = sourceLabel(data?.source);

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 shadow-xl h-full min-h-[320px] flex flex-col"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 24px var(--shadow)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {active?.symbol || 'Token'}
            </h2>
            {Number.isFinite(Number(change)) && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {up ? '+' : ''}
                {Number(change).toFixed(2)}%{data?.source === 'coingecko' || days <= 1 ? ' 24h' : ''}
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {data?.price ? formatUsdCompact(data.price) : isLoading ? '…' : '—'}
          </p>
          <p className="text-xs mt-1 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            {live && (
              <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--finance-green, #00ff88)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                Live
              </span>
            )}
            <span>{src ? `USD · ${src}` : 'USD market chart'}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {['in', 'out'].map((side) => {
              const tok = side === 'in' ? tokenIn : tokenOut;
              const selected = focus === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setFocus(side)}
                  className="px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: selected ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
                    color: selected ? 'var(--finance-primary, #00e5ff)' : 'var(--text-secondary)',
                  }}
                >
                  {tok?.symbol || (side === 'in' ? 'Pay' : 'Receive')}
                </button>
              );
            })}
          </div>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {RANGES.map((r) => {
              const selected = days === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDays(r.id)}
                  className="px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: selected ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
                    color: selected ? 'var(--finance-primary, #00e5ff)' : 'var(--text-secondary)',
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading && chartData.length < 2 ? (
        <div
          className="flex-1 min-h-[220px] animate-pulse rounded-xl"
          style={{ backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.04))' }}
        />
      ) : chartData.length >= 2 ? (
        <div className="flex-1 min-h-[220px]" aria-label={`${active?.symbol} price chart`}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" style={{ stroke: 'var(--border-color)' }} />
              <XAxis
                dataKey="label"
                minTickGap={28}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                width={56}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatUsd(v).replace('$', '')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [formatUsdCompact(value), 'Price']}
              />
              <Area
                type="monotone"
                dataKey="p"
                stroke="var(--accent-cyan)"
                fill={`url(#${fillId})`}
                strokeWidth={2}
                name="Price"
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="flex-1 min-h-[220px] flex items-center justify-center rounded-xl px-4 text-center text-sm"
          style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.03))' }}
        >
          {emptyCopy(data?.unavailableReason)}
        </div>
      )}
    </div>
  );
}
