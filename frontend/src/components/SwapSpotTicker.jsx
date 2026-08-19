import React from 'react';
import { formatMarketChange, formatMarketPrice, formatMarketVolume } from '../services/dexMarketsService';

/**
 * Binance-style spot ticker for the selected discovery pair.
 */
export default function SwapSpotTicker({ market, networkName, fallbackPair }) {
  const pair = market?.pair || fallbackPair;
  const change = formatMarketChange(market?.change24h);
  const up = Number(market?.change24h) >= 0;
  return (
    <div
      className="rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {market?.logo ? (
          <img src={market.logo} alt="" className="w-8 h-8 rounded-full bg-gray-700" />
        ) : null}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#f0b90b' }}>
              Spot
            </span>
            <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {pair}
            </h2>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {networkName} · on-chain swap
          </p>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Last price</p>
        <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {market?.priceUsd ? formatMarketPrice(market.priceUsd) : '—'}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>24h change</p>
        <p className={`text-lg font-bold tabular-nums ${change == null ? 'text-gray-500' : up ? 'text-green-400' : 'text-red-400'}`}>
          {change || '—'}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase" style={{ color: 'var(--text-tertiary)' }}>24h volume</p>
        <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {formatMarketVolume(market?.volume24h)}
        </p>
      </div>
    </div>
  );
}
