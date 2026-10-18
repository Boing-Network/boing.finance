import React from 'react';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];
function colorFor(symbol) {
  let h = 0;
  for (const ch of String(symbol || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Letter avatar for a token symbol (no images on the testnet token list). */
export function TokenIcon({ symbol, size = 28 }) {
  const s = String(symbol || '?').replace(/^t(?=[A-Z])/, '');
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white ring-2"
      style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor(symbol), '--tw-ring-color': 'var(--bg-card)' }}
      aria-hidden
    >
      {s.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Overlapping pair of token avatars. */
export default function BoingTokenPairIcons({ a, b, size = 28 }) {
  return (
    <span className="inline-flex items-center" aria-hidden>
      <TokenIcon symbol={a} size={size} />
      <span style={{ marginLeft: -size * 0.3 }}>
        <TokenIcon symbol={b} size={size} />
      </span>
    </span>
  );
}
