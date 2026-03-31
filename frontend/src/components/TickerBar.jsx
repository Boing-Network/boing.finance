import React, { useState, useEffect } from 'react';
import coingeckoService from '../services/coingeckoService';
import { BOING_USD_REFERENCE_PRICE } from '../config/boingEconomics';

/**
 * Deep Trade — scrolling price ticker bar.
 * Renders in flow directly under the nav (landing only). Live prices from CoinGecko with static fallback.
 */
const BOING_TICKER_ID = 'boing-native-reference';
const TICKER_COIN_IDS = ['bitcoin', 'ethereum', BOING_TICKER_ID, 'solana', 'usd-coin'];
const TICKER_LABELS = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  [BOING_TICKER_ID]: 'BOING',
  solana: 'SOL',
  'usd-coin': 'USDC',
};
const FALLBACK_PRICES = {
  bitcoin: { usd: 94210, usd_24h_change: 1.5 },
  ethereum: { usd: 2841.2, usd_24h_change: 2.1 },
  [BOING_TICKER_ID]: { usd: BOING_USD_REFERENCE_PRICE, usd_24h_change: 0 },
  solana: { usd: 142.88, usd_24h_change: -0.8 },
  'usd-coin': { usd: 1.0001, usd_24h_change: 0.01 },
};

function formatPrice(usd) {
  if (usd == null) return '—';
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`;
  if (usd >= 1) return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(6)}`;
}

function TickerBar() {
  const [prices, setPrices] = useState(FALLBACK_PRICES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const idsForApi = TICKER_COIN_IDS.filter((id) => id !== BOING_TICKER_ID);
      const data = await coingeckoService.getSimplePrices(idsForApi);
      if (cancelled || !data) return;
      const next = {};
      TICKER_COIN_IDS.forEach((id) => {
        if (id === BOING_TICKER_ID) {
          next[id] = FALLBACK_PRICES[BOING_TICKER_ID];
          return;
        }
        const p = data[id];
        if (p && typeof p.usd === 'number') {
          next[id] = { usd: p.usd, usd_24h_change: p.usd_24h_change != null ? p.usd_24h_change : 0 };
        } else {
          next[id] = FALLBACK_PRICES[id] || { usd: 0, usd_24h_change: 0 };
        }
      });
      setPrices((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, []);

  const items = TICKER_COIN_IDS.map((id) => {
    const p = prices[id] || FALLBACK_PRICES[id];
    const change = p?.usd_24h_change ?? 0;
    const up = change >= 0;
    return {
      key: id,
      symbol: TICKER_LABELS[id] || id,
      price: formatPrice(p?.usd),
      change: change.toFixed(2),
      up,
      isBoingReference: id === BOING_TICKER_ID,
    };
  });

  const row = items.map((item) => (
    <div
      key={item.key}
      className="flex items-center gap-2 shrink-0 text-sm font-mono"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
        {item.symbol}
      </span>
      <span style={{ color: 'var(--text-secondary)' }}>{item.price}</span>
      <span
        className="font-semibold"
        style={{
          color: item.isBoingReference ? 'var(--text-tertiary)' : item.up ? 'var(--finance-green)' : 'var(--finance-red)',
        }}
        title={item.isBoingReference ? 'In-app reference for Boing native (not a live market feed)' : undefined}
      >
        {item.isBoingReference ? '◇ ref' : (
          <>{item.up ? '▲' : '▼'} {item.up ? '+' : ''}{item.change}%</>
        )}
      </span>
    </div>
  ));

  return (
    <div
      className="overflow-hidden border-b py-1.5"
      style={{
        background: 'rgba(3, 8, 16, 0.95)',
        borderColor: 'rgba(0, 229, 255, 0.08)',
      }}
      aria-hidden
    >
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{
          animation: 'tickerScroll 30s linear infinite',
        }}
      >
        {row}
        {row}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default TickerBar;
