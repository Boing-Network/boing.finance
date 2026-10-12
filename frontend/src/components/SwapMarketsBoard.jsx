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
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
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
          className="td-field__input text-xs"
        />
        <div className="td-segmented w-full mt-2" role="tablist" aria-label="Market sort">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onTab(t.id)}
                className={`td-segmented__btn flex-1 py-1.5 text-[11px] ${on ? 'td-segmented__btn--active' : ''}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        <span className="col-span-5">Pair</span>
        <span className="col-span-3 text-right">Last</span>
        <span className="col-span-4 text-right">24h</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !rows.length ? (
          <p className="px-3 py-6 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
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
                    className="w-full grid grid-cols-12 gap-1 px-3 py-2 text-left transition-colors"
                    style={{
                      backgroundColor: selected
                        ? 'color-mix(in srgb, var(--finance-primary) 10%, transparent)'
                        : 'transparent',
                      borderLeft: selected
                        ? '2px solid var(--finance-primary)'
                        : '2px solid transparent',
                    }}
                  >
                    <span className="col-span-5 flex items-center gap-2 min-w-0">
                      {m.logo ? (
                        <img
                          src={m.logo}
                          alt=""
                          className="w-5 h-5 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        />
                      ) : (
                        <span
                          className="w-5 h-5 rounded-full shrink-0 text-[10px] flex items-center justify-center font-semibold"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--finance-primary) 18%, var(--bg-tertiary))',
                            color: 'var(--finance-primary)',
                          }}
                        >
                          {m.symbol.slice(0, 1)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {m.pair}
                        </span>
                        <span className="block text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {formatMarketVolume(m.volume24h)} vol
                        </span>
                      </span>
                    </span>
                    <span className="col-span-3 text-right text-xs tabular-nums self-center" style={{ color: 'var(--text-primary)' }}>
                      {formatMarketPrice(m.priceUsd)}
                    </span>
                    <span
                      className="col-span-4 text-right text-xs tabular-nums font-semibold self-center"
                      style={{
                        color:
                          change == null
                            ? 'var(--text-secondary)'
                            : up
                              ? 'var(--finance-green, #22c55e)'
                              : 'var(--finance-red)',
                      }}
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
      <p className="px-3 py-2 text-[10px] border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
        Live DEX pools on this chain. Swap is on-chain — you keep the keys.
      </p>
    </div>
  );
}
