import React from 'react';

export default function PortfolioResearchPanel({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.3)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-300 mb-1">Research actions</p>
      <h2 className="text-lg font-bold text-white mb-3">Holdings → decisions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
            <p className="text-xs text-cyan-200/90 mb-2">{item.signal}</p>
            <p className="text-xs text-green-300/90"><span className="text-gray-500">Action · </span>{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
