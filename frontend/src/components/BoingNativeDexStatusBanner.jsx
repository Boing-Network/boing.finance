import React from 'react';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
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
        className="mb-4 rounded-xl border px-4 py-3 text-sm"
        role="status"
        style={{
          borderColor: 'rgba(251, 191, 36, 0.45)',
          backgroundColor: 'rgba(120, 53, 15, 0.2)',
          color: 'var(--text-primary, #f0f7ff)',
        }}
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
        className="mb-4 rounded-xl border px-4 py-3 text-sm"
        role="note"
        style={{
          borderColor: 'rgba(0, 229, 255, 0.28)',
          backgroundColor: 'rgba(2, 11, 38, 0.88)',
          color: 'var(--text-secondary, #b8d4f0)',
        }}
      >
        <strong className="text-teal-300">Boing L1 uses the Boing VM</strong> — the Solidity DEX (DEXFactoryV2, DEXRouter,
        LiquidityLocker) in this repo targets EVM chains only. A multi-pair DEX on L1 requires Boing VM bytecode, deployed
        AccountIds, and app wiring — not the same compiled Solidity. {link} ·{' '}
        <a
          href="https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-L1-DEX-ENGINEERING.md"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
          style={{ color: 'var(--accent-cyan, #38bdf8)' }}
        >
          Network engineering checklist
        </a>
      </div>
    );
  }

  return (
    <div
      className="mb-4 rounded-lg border px-3 py-2 text-xs"
      style={{
        borderColor: 'rgba(148, 163, 184, 0.25)',
        color: 'var(--text-tertiary, #7a9bc8)',
      }}
    >
      Native AMM pool is available on this network. For a Uniswap-style factory/router on L1, see {link}.
    </div>
  );
}

export default BoingNativeDexStatusBanner;
