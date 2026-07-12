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
    <div className="rounded-2xl p-5 mb-6 bg-gray-800 border border-purple-500/30">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-300 mb-1">Behavioral fingerprint</p>
          <h2 className="text-lg font-bold text-white">Wallet clustering & flow patterns</h2>
          <p className="text-xs text-gray-400 mt-1">
            Cohort-style analysis from your onchain activity — chain concentration, flow mix, execution cadence
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center shrink-0">
          <p className="text-xs text-gray-400">Persona</p>
          <p className="text-sm font-bold text-purple-200">{fingerprint.persona}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
          <p className="text-xs text-gray-500">Primary chain</p>
          <p className="text-sm font-semibold text-white">{primaryChainName}</p>
          <p className="text-xs text-cyan-400">{fingerprint.chainConcentration.toFixed(0)}% of txs</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
          <p className="text-xs text-gray-500">Swap mix</p>
          <p className="text-sm font-semibold text-blue-400">{(fingerprint.swapRatio * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
          <p className="text-xs text-gray-500">Liquidity ops</p>
          <p className="text-sm font-semibold text-green-400">{(fingerprint.liqRatio * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-900/50 border border-gray-700">
          <p className="text-xs text-gray-500">Bridge / migrate</p>
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
  );
}
