import React, { useMemo } from 'react';
import { computeBehavioralFingerprint } from '../../utils/researchIntelligence';
import { NETWORKS } from '../../config/networks';

export default function WalletBehaviorPanel({ transactions, stats }) {
  const fingerprint = useMemo(
    () => computeBehavioralFingerprint(transactions, stats),
    [transactions, stats]
  );

  if (!fingerprint) return null;

  const primaryChainName = fingerprint.primaryChain
    ? NETWORKS[fingerprint.primaryChain[0]]?.name || `Chain ${fingerprint.primaryChain[0]}`
    : '—';

  return (
    <details className="rounded-2xl mb-6 bg-gray-800 border border-gray-700 overflow-hidden">
      <summary className="cursor-pointer px-4 sm:px-5 py-4 text-sm font-medium text-gray-200 hover:bg-gray-800/80">
        Activity patterns (optional)
      </summary>
      <div className="px-4 sm:px-5 pb-5 border-t border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 pt-4">
          <div>
            <h2 className="text-lg font-bold text-white">How you use this wallet</h2>
            <p className="text-xs text-gray-400 mt-1">
              Simple mix of swaps, liquidity, and bridges from your history
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-900/60 border border-gray-600 text-center shrink-0">
            <p className="text-xs text-gray-400">Style</p>
            <p className="text-sm font-bold text-cyan-200">{fingerprint.persona}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
            <p className="text-xs text-gray-500">Main network</p>
            <p className="text-sm font-semibold text-white">{primaryChainName}</p>
            <p className="text-xs text-cyan-400">{fingerprint.chainConcentration.toFixed(0)}% of txs</p>
          </div>
          <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
            <p className="text-xs text-gray-500">Swaps</p>
            <p className="text-sm font-semibold text-blue-400">{(fingerprint.swapRatio * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
            <p className="text-xs text-gray-500">Liquidity</p>
            <p className="text-sm font-semibold text-green-400">{(fingerprint.liqRatio * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
            <p className="text-xs text-gray-500">Bridges</p>
            <p className="text-sm font-semibold text-purple-400">{(fingerprint.bridgeRatio * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          {fingerprint.patterns.map((p) => (
            <div key={p.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-3 rounded-lg bg-gray-900/30 border border-gray-700/50">
              <span className="text-sm font-medium text-white sm:w-40 shrink-0">{p.label}</span>
              <span className="text-sm text-cyan-300 sm:w-48 shrink-0">{p.value}</span>
              <span className="text-xs text-gray-400">{p.insight}</span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
