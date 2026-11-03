/**
 * Trading on boing.finance is Boing Network only, signed with Boing Express. The /bridge page can connect an
 * EVM wallet into the shared wallet context; when that wallet is active, trading pages ask to switch back.
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { resolveDefaultBoingInjectedProvider, getBoingWebWalletFallbackProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

export function useConnectBoingExpress() {
  const { connectWalletWithProvider } = useWallet();
  const [busy, setBusy] = useState(false);
  const connect = async () => {
    setBusy(true);
    try {
      // Extension first; the boing.express web wallet (popup signing) covers browsers without it.
      const provider = (await resolveDefaultBoingInjectedProvider()) || getBoingWebWalletFallbackProvider();
      await connectWalletWithProvider(provider, 'boingExpress', BOING_NATIVE_L1_CHAIN_ID);
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
    }
  };
  return { connect, busy };
}

export default function BoingOnlyGate({ children }) {
  const { isConnected, chainId } = useWallet();
  const { connect, busy } = useConnectBoingExpress();
  if (isConnected && chainId != null && Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" data-testid="boing-only-gate">
        <div className="td-card p-8">
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Switch to Boing Express
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Swaps, pools and liquidity run on Boing Network. The connected wallet is on another chain (used for the
            bridge). Connect Boing Express to trade.
          </p>
          <button type="button" className="btn btn-green" onClick={connect} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect Boing Express'}
          </button>
        </div>
      </div>
    );
  }
  return children;
}
