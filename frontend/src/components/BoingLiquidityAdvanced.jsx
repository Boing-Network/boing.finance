import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import NativeBoingManagePoolPanel from './NativeBoingManagePoolPanel';
import NativeLiquidityPositionsPanel from './NativeLiquidityPositionsPanel';
import NativeAmmLpVaultPanel from './NativeAmmLpVaultPanel';

/**
 * Pools → Your liquidity → Advanced (collapsed): the tools from the old /liquidity page — add/remove in any
 * pool by pasting its id, every LP position across the directory, and the LP vault.
 */
export default function BoingLiquidityAdvanced() {
  const { isConnected, account } = useWallet();
  return (
    <details className="mt-6 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }} data-testid="liquidity-advanced">
      <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-secondary)' }} data-testid="liquidity-advanced-summary">
        Advanced — any pool by id, all LP positions, LP vault
      </summary>
      <div className="mt-3">
        {!isConnected || !account ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Connect Boing Express to use these tools.</p>
        ) : (
          <>
            <NativeBoingManagePoolPanel />
            <NativeLiquidityPositionsPanel />
            <div className="mt-4">
              <NativeAmmLpVaultPanel compact />
            </div>
          </>
        )}
      </div>
    </details>
  );
}
