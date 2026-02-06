import React from 'react';
import { getNetworkByChainId } from '../config/networks';
import { getChainsWithDex } from '../config/featureSupport';

/**
 * Shows a banner when the current chain doesn't support the feature (e.g. Create Pool / Liquidity).
 * Renders nothing if the chain is supported.
 */
export default function NetworkSupportBanner({ featureLabel, chainIdsSupported, currentChainId, onSwitchNetwork }) {
  const supported = chainIdsSupported.includes(Number(currentChainId));
  if (supported || !currentChainId) return null;

  const chainNames = chainIdsSupported
    .map((id) => getNetworkByChainId(id)?.name)
    .filter(Boolean);
  const primaryChainId = chainIdsSupported[0];
  const primaryName = getNetworkByChainId(primaryChainId)?.name || `Chain ${primaryChainId}`;

  return (
    <div
      className="relative z-10 rounded-xl border p-4 mb-6 flex flex-wrap items-center justify-between gap-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)'
      }}
    >
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{featureLabel}</strong> is available on{' '}
        {chainNames.length > 1 ? chainNames.join(', ') : primaryName}. Switch network to continue.
      </p>
      {typeof onSwitchNetwork === 'function' && (
        <button
          type="button"
          onClick={() => onSwitchNetwork(primaryChainId)}
          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
        >
          Switch to {primaryName}
        </button>
      )}
    </div>
  );
}

/**
 * Convenience wrapper for DEX features (Create Pool, Liquidity) that are only on Sepolia for now.
 */
export function DexFeatureBanner({ featureLabel, currentChainId, onSwitchNetwork }) {
  const chainsWithDex = getChainsWithDex();
  return (
    <NetworkSupportBanner
      featureLabel={featureLabel}
      chainIdsSupported={chainsWithDex}
      currentChainId={currentChainId}
      onSwitchNetwork={onSwitchNetwork}
    />
  );
}
