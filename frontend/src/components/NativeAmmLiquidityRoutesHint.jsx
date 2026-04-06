import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import getFeatureSupport from '../config/featureSupport';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

/**
 * When native CP pool is configured on Boing L1, EVM “Create pool” / factory flows stay unavailable;
 * point users to Swap for add-liquidity + swap.
 */
export default function NativeAmmLiquidityRoutesHint() {
  const { chainId } = useWallet();
  const { effectivePoolHex } = useBoingNativeDexIntegration();
  const fs = useMemo(
    () =>
      getFeatureSupport(Number(chainId) || 0, {
        nativeConstantProductPoolHex:
          Number(chainId) === BOING_NATIVE_L1_CHAIN_ID ? effectivePoolHex : undefined,
      }),
    [chainId, effectivePoolHex]
  );

  if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID || !fs.hasNativeAmm) {
    return null;
  }

  return (
    <div
      className="mb-4 rounded-lg border px-3 py-2 text-sm text-left"
      style={{
        borderColor: 'rgba(59, 130, 246, 0.45)',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-secondary)',
      }}
    >
      <strong style={{ color: 'var(--text-primary)' }}>Native AMM pool</strong> is configured for this chain.
      EVM factory pool creation is not used here — add liquidity and swap from the{' '}
      <Link to="/swap" className="text-blue-400 underline font-medium">
        Swap
      </Link>{' '}
      page (Boing Express).
    </div>
  );
}
