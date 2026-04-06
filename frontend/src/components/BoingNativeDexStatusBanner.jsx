import React from 'react';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import {
  BOING_NETWORK_BOING_L1_DEX_ENGINEERING_URL,
  BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL,
} from '../config/boingNetworkDocsUrls';
import { getBoingL1DexDocsUrl, isNativeVmDexUiEnabled } from '../services/boingNativeDexContracts';

/**
 * Explains Boing L1 vs Solidity DEX and surfaces nativeVm module status.
 * @param {{ chainId: string | number, featureSupport: object }} props
 */
export function BoingNativeDexStatusBanner({ chainId, featureSupport }) {
  if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID || !featureSupport) return null;
  if (isNativeVmDexUiEnabled()) return null;

  const { hasNativeAmm, nativeVmDex } = featureSupport;
  const docsUrl = getBoingL1DexDocsUrl();

  const link = docsUrl ? (
    <a
      href={docsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="underline font-medium"
      style={{ color: 'var(--accent-cyan, #38bdf8)' }}
    >
      Documentation
    </a>
  ) : (
    <span className="text-gray-400">Repo: docs/boing-l1-vs-evm-dex.md</span>
  );

  if (nativeVmDex?.swapParityMinimum) {
    return (
      <div
        className="boing-feature-banner boing-feature-banner--amber mb-4 px-4 py-3 text-sm relative z-10"
        role="status"
        style={{ color: 'var(--text-primary, #f0f7ff)' }}
      >
        <strong className="text-amber-200">Boing VM DEX modules configured.</strong>{' '}
        Factory and router AccountIds are set in this build, but swap/router UI integration is still in progress.{' '}
        {link}
      </div>
    );
  }

  if (!hasNativeAmm) {
    return (
      <div
        className="boing-feature-banner mb-4 px-4 py-3 text-sm relative z-10"
        role="note"
        style={{ color: 'var(--text-secondary, #b8d4f0)' }}
      >
        <strong className="text-cyan-300">Boing L1 uses the Boing VM</strong> — the Solidity DEX (DEXFactoryV2, DEXRouter,
        LiquidityLocker) in this repo targets EVM chains only. A multi-pair DEX on L1 requires Boing VM bytecode, deployed
        AccountIds, and app wiring — not the same compiled Solidity. {link} ·{' '}
        <a
          href={BOING_NETWORK_BOING_L1_DEX_ENGINEERING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
          style={{ color: 'var(--accent-cyan, #38bdf8)' }}
        >
          Network engineering checklist
        </a>
        {' '}
        ·{' '}
        <a
          href={BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
          style={{ color: 'var(--accent-cyan, #38bdf8)' }}
        >
          Partner handoff
        </a>
      </div>
    );
  }

  return (
    <div
      className="boing-feature-banner mb-4 px-3 py-2 text-xs relative z-10"
      style={{ color: 'var(--text-tertiary, #7a9bc8)' }}
    >
      Native AMM pool is available on this network. For a Uniswap-style factory/router on L1, see {link}.
    </div>
  );
}

export default BoingNativeDexStatusBanner;
