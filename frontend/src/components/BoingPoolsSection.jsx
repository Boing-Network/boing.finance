import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BoingPoolsTab from './BoingPoolsTab';
import { useBoingPools } from '../hooks/useBoingPools';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getWindowBoingProvider, boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { boingAddLiquidityHref, boingSwapPairHref } from '../utils/swapPoolsRedirect';

/**
 * Boing pools on the Pools page: searchable cards (pair, liquidity, price, your share, details) with
 * Add liquidity (opens Swap > Your liquidity with the pool filled in), Swap (opens Swap with the pair
 * selected) and Create a pool. Reads pools straight from the network, so it works before connecting.
 *
 * @param {{ account?: string | null, initialQuery?: string }} props
 */
export default function BoingPoolsSection({ account = null, initialQuery = '' }) {
  const pools = useBoingPools(account || null);
  const navigate = useNavigate();
  const { connectWalletWithProvider } = useWallet();
  // Adding liquidity needs Boing Express: connect first when the visitor is browsing without a wallet.
  const addLiquidity = async (c) => {
    const href = boingAddLiquidityHref(c.poolHex);
    if (account) {
      navigate(href);
      return;
    }
    const provider = getWindowBoingProvider();
    if (!provider) {
      toast.error(boingWalletMissingMessage());
      return;
    }
    try {
      await connectWalletWithProvider(provider, 'boingExpress', BOING_NATIVE_L1_CHAIN_ID);
      navigate(href);
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    }
  };
  return (
    <section className="td-card p-4 sm:p-6" data-testid="boing-pools-section" aria-labelledby="boing-pools-title">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="boing-pools-title" className="td-section-title mb-0">
            Boing pools
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Swap in any pool, or add both tokens to earn a share of every swap fee.
          </p>
        </div>
        {account && (
          <Link to="/swap?nativeTradeTab=liquidity" className="text-sm underline" style={{ color: 'var(--finance-primary)' }} data-testid="pools-your-liquidity-link">
            Your liquidity
          </Link>
        )}
      </div>
      <BoingPoolsTab
        key={initialQuery || 'pools'}
        pools={pools}
        initialQuery={initialQuery}
        onSwap={(c) => navigate(boingSwapPairHref(c.tokenA.id, c.tokenB.id))}
        onAddLiquidity={addLiquidity}
      />
    </section>
  );
}
