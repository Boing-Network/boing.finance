import React from 'react';

export default function PortfolioResearchPanel({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <details
      className="rounded-2xl mb-6 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <summary className="cursor-pointer px-4 sm:px-5 py-4 text-sm font-medium hover:opacity-90" style={{ color: 'var(--text-secondary)' }}>
        Quick notes on your holdings
      </summary>
      <div className="px-4 sm:px-5 pb-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-bold text-white mb-3 pt-3">What stands out</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
              <p className="text-xs text-cyan-200/90 mb-2">{item.signal}</p>
              <p className="text-xs text-green-300/90"><span className="text-gray-500">Next step · </span>{item.action}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
