import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useWallet } from '../contexts/WalletContext';
import NativeBoingManagePoolPanel from '../components/NativeBoingManagePoolPanel';
import NativeAmmLpVaultPanel from '../components/NativeAmmLpVaultPanel';
import NativeLiquidityPositionsPanel from '../components/NativeLiquidityPositionsPanel';
import BoingOnlyGate, { useConnectBoingExpress } from '../components/BoingOnlyGate';

const DESC = 'Add or remove liquidity in native Boing pools and earn a share of swap fees, signed with Boing Express.';

const Liquidity = () => {
  const { isConnected, account } = useWallet();
  const { connect, busy } = useConnectBoingExpress();
  return (
    <>
      <Helmet>
        <title>Liquidity | boing.finance — Earn fees on Boing Network</title>
        <meta name="description" content={DESC} />
        <meta property="og:title" content="Liquidity | boing.finance" />
        <meta property="og:description" content={DESC} />
        <meta property="og:url" content="https://boing.finance/liquidity" />
      </Helmet>
      <BoingOnlyGate>
        <div className="relative w-full min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                Your liquidity
              </h1>
              <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Add or remove tokens from a pool to earn a share of swap fees.
              </p>
            </div>
            {!isConnected || !account ? (
              <div className="text-center py-8">
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Connect Boing Express to add or remove liquidity.</p>
                <button type="button" onClick={connect} disabled={busy} className="btn btn-green">
                  {busy ? 'Connecting…' : 'Connect Boing Express'}
                </button>
              </div>
            ) : (
              <div className="mb-6">
                <NativeBoingManagePoolPanel />
                <NativeLiquidityPositionsPanel />
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Advanced — LP vault
                  </summary>
                  <div className="mt-3">
                    <NativeAmmLpVaultPanel compact />
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </BoingOnlyGate>
    </>
  );
};

export default Liquidity;
