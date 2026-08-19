import React from 'react';
import { formatMarketChange, formatMarketPrice, formatMarketVolume } from '../services/dexMarketsService';

const TABS = [
  { id: 'trending', label: 'Trending' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'volume', label: 'Volume' },
];

/**
 * CEX-style markets list: trending tokens on the active chain, click to trade.
 */
export default function SwapMarketsBoard({
  networkName,
  tab,
  onTab,
  queryText,
  onQueryText,
  rows,
  isLoading,
  selectedAddress,
  onSelect,
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full min-h-[360px] max-h-[720px]"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 24px var(--shadow)',
      }}
    >
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Markets
          </h2>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            {networkName}
          </span>
        </div>
        <label htmlFor="swap-markets-search" className="sr-only">
          Search markets
        </label>
        <input
          id="swap-markets-search"
          type="search"
          value={queryText}
          onChange={(e) => onQueryText(e.target.value)}
          placeholder="Search coin"
          className="w-full text-xs rounded-lg px-2.5 py-2 bg-gray-800 text-white placeholder-gray-500 outline-none"
          style={{ border: '1px solid var(--border-color)' }}
        />
        <div className="flex mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                className="flex-1 py-1.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: on ? 'rgba(240, 185, 11, 0.14)' : 'transparent',
                  color: on ? '#f0b90b' : 'var(--text-secondary)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        <span className="col-span-5">Pair</span>
        <span className="col-span-3 text-right">Last</span>
        <span className="col-span-4 text-right">24h</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !rows.length ? (
          <p className="px-3 py-6 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Loading {networkName} markets…
          </p>
        ) : !rows.length ? (
          <p className="px-3 py-6 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            No trending DEX pools for this chain yet. Switch network or try a listed token.
          </p>
        ) : (
          <ul>
            {rows.map((m) => {
              const selected = selectedAddress && m.address.toLowerCase() === selectedAddress.toLowerCase();
              const up = Number(m.change24h) >= 0;
              const change = formatMarketChange(m.change24h);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m)}
                    className="w-full grid grid-cols-12 gap-1 px-3 py-2 text-left hover:bg-white/5"
                    style={{
                      backgroundColor: selected ? 'rgba(240, 185, 11, 0.08)' : 'transparent',
                      borderLeft: selected ? '2px solid #f0b90b' : '2px solid transparent',
                    }}
                  >
                    <span className="col-span-5 flex items-center gap-2 min-w-0">
                      {m.logo ? (
                        <img src={m.logo} alt="" className="w-5 h-5 rounded-full shrink-0 bg-gray-700" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-gray-700 shrink-0 text-[10px] flex items-center justify-center text-gray-300">
                          {m.symbol.slice(0, 1)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {m.pair}
                        </span>
                        <span className="block text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {formatMarketVolume(m.volume24h)} vol
                        </span>
                      </span>
                    </span>
                    <span className="col-span-3 text-right text-xs tabular-nums self-center" style={{ color: 'var(--text-primary)' }}>
                      {formatMarketPrice(m.priceUsd)}
                    </span>
                    <span
                      className={`col-span-4 text-right text-xs tabular-nums font-semibold self-center ${
                        change == null ? 'text-gray-500' : up ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {change || '—'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="px-3 py-2 text-[10px] border-t" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}>
        Live DEX pools on this chain. Swap is on-chain — you keep the keys.
      </p>
    </div>
  );
}
