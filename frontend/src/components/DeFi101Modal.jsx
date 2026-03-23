import React, { useState } from 'react';

const DEFI_TOPICS = [
  { id: 'slippage', title: 'Slippage', body: 'Max price change between submitting and confirming a swap. Higher slippage helps in volatile markets.' },
  { id: 'apy', title: 'APY', body: 'Annual Percentage Yield from providing liquidity. APY varies with trading volume.' },
  { id: 'il', title: 'Impermanent Loss', body: 'When pool token prices change vs deposit time, holdings may be worth less. Can reverse if prices return.' },
  { id: 'lp', title: 'Liquidity Provider', body: 'You supply token pairs to a pool and earn trading fees. LP tokens represent your share.' },
  { id: 'dex', title: 'DEX', body: 'Decentralized Exchange. Trades happen via smart contracts without a central custodian.' }
];

export default function DeFi101Modal({ isOpen, onClose }) {
  const [activeTopic, setActiveTopic] = useState(null);
  const [showILCalc, setShowILCalc] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>DeFi 101</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Close">&times;</button>
        </div>
        <div className="space-y-2 mb-4">
          {DEFI_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTopic(activeTopic === t.id ? null : t.id)}
              className="w-full text-left p-3 rounded-lg border"
              style={{ backgroundColor: activeTopic === t.id ? 'var(--bg-card)' : 'transparent', borderColor: 'var(--border-color)' }}
            >
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
            </button>
          ))}
        </div>
        {activeTopic && (
          <div className="p-4 rounded-lg border mb-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            {DEFI_TOPICS.find((t) => t.id === activeTopic)?.body}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowILCalc(!showILCalc)}
          className="w-full py-2 rounded-lg font-medium border mb-2"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {showILCalc ? 'Hide' : 'Show'} IL Calculator
        </button>
        {showILCalc && <ILCalculator />}
      </div>
    </div>
  );
}

function ILCalculator() {
  const [priceChange, setPriceChange] = useState(50);
  const p = 1 + priceChange / 100;
  const ilPercent = 2 * (Math.sqrt(p) / (1 + p) - 1) * 100;
  return (
    <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <label htmlFor="defi101-price-change" className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>If one token price moves by:</label>
      <input id="defi101-price-change" name="priceChange" type="range" min="-90" max="200" value={priceChange} onChange={(e) => setPriceChange(Number(e.target.value))} className="w-full mb-2" />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        IL approx <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ilPercent.toFixed(2)}%</span>
      </p>
    </div>
  );
}
