import React from 'react';
import { getNetworkByChainId, BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getChainsWithDex } from '../config/featureSupport';
import { getExternalSwapUrl } from '../config/networkExternalLinks';

/**
 * Shows a banner when the current chain doesn't support the feature (e.g. Create Pool / Liquidity).
 * Renders nothing if the chain is supported.
 * For Swap/Liquidity/Pools: offers Switch to Boing network OR use external DEX (mainnet-ready).
 */
export default function NetworkSupportBanner({ featureLabel, chainIdsSupported, currentChainId, onSwitchNetwork, showExternalLink = true }) {
  const supported = chainIdsSupported.includes(Number(currentChainId));
  if (supported || !currentChainId) return null;

  const chainNames = chainIdsSupported
    .map((id) => getNetworkByChainId(id)?.name)
    .filter(Boolean);
  const primaryChainId = chainIdsSupported[0];
  const primaryName = getNetworkByChainId(primaryChainId)?.name || `Chain ${primaryChainId}`;
  const externalUrl = showExternalLink && (featureLabel === 'Swap' || featureLabel === 'Liquidity' || featureLabel === 'Create Pool')
    ? getExternalSwapUrl(currentChainId)
    : null;

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
        {chainNames.length > 1 ? chainNames.join(', ') : primaryName}. Switch network or use external DEX.
        {Number(currentChainId) === BOING_NATIVE_L1_CHAIN_ID && (
          <span className="block mt-2 text-xs opacity-90">
            On Boing testnet, native BOING pays fees; this in-app EVM DEX is wired to Sepolia until factory/router
            deploy on Boing.
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
          >
            {featureLabel} on External DEX →
          </a>
        )}
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
