// Fair Launch Checklist
// Post-deployment checklist: renounce ownership, lock liquidity, contract verification

import React from 'react';

const CHECKLIST_ITEMS = [
  {
    id: 'renounce',
    label: 'Renounce ownership',
    description: 'Transfer contract ownership to zero address. Prevents future changes.',
    icon: '🔒',
  },
  {
    id: 'lock',
    label: 'Lock liquidity',
    description: 'Lock LP tokens in a locker (e.g. Team Finance, Unicrypt).',
    icon: '🔐',
  },
  {
    id: 'verify',
    label: 'Verify contract',
    description: 'Verify on block explorer (Etherscan, etc.) for transparency.',
    icon: '✓',
  },
];

export default function FairLaunchChecklist({
  tokenAddress,
  txHash: _txHash,
  chainId,
  onRenounce,
  isRenounced,
  className = '',
}) {
  const getExplorerUrl = () => {
    const explorers = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      56: 'https://bscscan.com',
      42161: 'https://arbiscan.io',
      10: 'https://optimistic.etherscan.io',
      8453: 'https://basescan.org',
      11155111: 'https://sepolia.etherscan.io',
    };
    return explorers[chainId] || 'https://etherscan.io';
  };

  return (
    <div
      className={`rounded-xl border p-6 ${className}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Fair Launch Checklist
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Complete these steps to build trust with your community.
      </p>
      <ul className="space-y-4">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                {item.id === 'renounce' && isRenounced && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/50 text-green-400">
                    Done
                  </span>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
              {item.id === 'renounce' && onRenounce && !isRenounced && (
                <button
                  type="button"
                  onClick={onRenounce}
                  className="mt-2 interactive-button px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Renounce now
                </button>
              )}
              {item.id === 'verify' && tokenAddress && (
                <a
                  href={`${getExplorerUrl()}/address/${tokenAddress}#code`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 interactive-link text-blue-400 hover:text-blue-300 text-sm"
                >
                  Verify on Explorer →
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
