import React, { useState } from 'react';

const LEARN_CONTENT = {
  slippage: {
    title: 'Slippage',
    body: 'The maximum price change you accept between submitting and confirming a swap. Higher slippage may help transactions succeed in volatile markets but can result in worse execution.'
  },
  apy: {
    title: 'APY (Annual Percentage Yield)',
    body: 'Estimated yearly return from providing liquidity, including trading fees. APY can vary with volume and is not guaranteed.'
  },
  impermanentLoss: {
    title: 'Impermanent Loss',
    body: 'When the price ratio of your deposited tokens changes vs when you deposited, your holdings may be worth less than simply holding. "Impermanent" because the loss can reverse if prices return.'
  },
  liquidity: {
    title: 'Liquidity Provider',
    body: 'You supply token pairs to a pool and earn a share of trading fees. You receive LP tokens representing your share.'
  }
};

/**
 * Inline "Learn" tooltip for DeFi concepts.
 */
export default function LearnTooltip({ topic, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const content = LEARN_CONTENT[topic] || { title: topic, body: 'Learn more.' };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 p-0.5 rounded text-cyan-400 hover:bg-cyan-500/20"
        aria-label={`Learn: ${content.title}`}
        title={`Learn: ${content.title}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {children}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute left-0 top-full mt-1 z-50 min-w-[240px] max-w-[320px] p-3 rounded-lg border shadow-xl text-left"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}
          >
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              {content.title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {content.body}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 text-xs underline"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
