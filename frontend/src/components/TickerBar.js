import React from 'react';

/**
 * Deep Trade — scrolling price ticker bar.
 * Renders below nav on the landing page. Uses JetBrains Mono for prices.
 */
const TICKER_ITEMS = [
  { symbol: 'BOING', price: '$0.0042', change: 12.4, up: true },
  { symbol: 'ETH', price: '$2,841.20', change: 2.1, up: true },
  { symbol: 'SOL', price: '$142.88', change: -0.8, up: false },
  { symbol: 'BTC', price: '$94,210', change: 1.5, up: true },
  { symbol: 'USDC', price: '$1.0001', change: 0.01, up: true },
  { symbol: 'BOING/ETH', price: '0.00000148', change: 8.2, up: true },
];

function TickerBar() {
  const row = TICKER_ITEMS.map((item) => (
    <div
      key={item.symbol}
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
          color: item.up ? 'var(--finance-green)' : 'var(--finance-red)',
        }}
      >
        {item.up ? '▲' : '▼'} {item.up ? '+' : ''}{item.change}%
      </span>
    </div>
  ));

  return (
    <div
      className="fixed left-0 right-0 z-[29] overflow-hidden border-b py-1.5"
      style={{
        top: '3.5rem',
        background: 'rgba(3, 8, 16, 0.95)',
        borderColor: 'rgba(0, 229, 255, 0.08)',
      }}
      aria-hidden
    >
      <div
        className="flex gap-10 animate-ticker whitespace-nowrap"
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
