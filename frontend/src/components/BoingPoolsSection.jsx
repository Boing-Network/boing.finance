import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import BoingPoolsTab from './BoingPoolsTab';
import BoingYourLiquidityTab from './BoingYourLiquidityTab';
import { useBoingPools } from '../hooks/useBoingPools';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getWindowBoingProvider, boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { boingSwapPairHref, parsePoolsTab } from '../utils/swapPoolsRedirect';

const TABS = [
  { id: 'all', label: 'All pools' },
  { id: 'liquidity', label: 'Your liquidity' },
];

/**
 * Boing pools on the Pools page, in two tabs (deep link `/pools?tab=all|liquidity`):
 * - All pools: searchable cards (pair, liquidity, price, your share, details) with Add liquidity, Swap (opens
 *   Swap with the pair selected) and Create a pool. Reads pools straight from the network, so it works before connecting.
 * - Your liquidity: your positions with Add / Remove, and the add form.
 * `?tab=liquidity&addPool=0x…` opens the add form for that pool once pools have loaded.
 *
 * @param {{ account?: string | null, initialQuery?: string }} props
 */
export default function BoingPoolsSection({ account = null, initialQuery = '' }) {
  const pools = useBoingPools(account || null);
  const navigate = useNavigate();
  const { connectWalletWithProvider } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parsePoolsTab(searchParams.get('tab'));
  const [addFor, setAddFor] = useState(/** @type {any} */ (null));
  const clearAddFor = useCallback(() => setAddFor(null), []);

  const setTab = useCallback(
    (id, extra = {}) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (id === 'all') n.delete('tab');
          else n.set('tab', id);
          for (const [k, v] of Object.entries(extra)) {
            if (v == null) n.delete(k);
            else n.set(k, v);
          }
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Fresh reserves / LP balances whenever Your liquidity opens (e.g. right after a swap).
  const reloadPools = pools.reload;
  useEffect(() => {
    if (tab === 'liquidity') reloadPools();
  }, [tab, reloadPools]);

  // `addPool` deep link (and the card button after connecting): open the add form once pools have loaded.
  const addPoolParam = searchParams.get('addPool')?.trim().toLowerCase() || '';
  const poolCards = pools.cards;
  useEffect(() => {
    if (!/^0x[0-9a-f]{64}$/.test(addPoolParam)) return;
    if (pools.loading) return;
    const card = (poolCards || []).find((c) => String(c.poolHex).toLowerCase() === addPoolParam);
    if (card) setAddFor(card);
    else toast.error('That pool was not found. Pick a pair below.');
    setTab('liquidity', { addPool: null });
  }, [addPoolParam, poolCards, pools.loading, setTab]);

  // Adding liquidity needs Boing Express: connect first when the visitor is browsing without a wallet.
  const addLiquidity = async (c) => {
    if (account) {
      setAddFor(c);
      setTab('liquidity');
      return;
    }
    const provider = getWindowBoingProvider();
    if (!provider) {
      toast.error(boingWalletMissingMessage());
      return;
    }
    try {
      await connectWalletWithProvider(provider, 'boingExpress', BOING_NATIVE_L1_CHAIN_ID);
      // The page re-renders for the connected wallet; the URL carries the pool across.
      setTab('liquidity', { addPool: c.poolHex });
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    }
  };

  return (
    <section className="td-card p-4 sm:p-6" data-testid="boing-pools-section" aria-labelledby="boing-pools-title">
      <div className="mb-4">
        <h2 id="boing-pools-title" className="td-section-title mb-0">
          Boing pools
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Swap in any pool, or add both tokens to earn a share of every swap fee.
        </p>
      </div>
      <div
        className="mb-4 flex gap-1 rounded-xl border p-1"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        role="tablist"
        aria-label="Boing pools"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`boing-pools-tab-${t.id}`}
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            data-testid={`pools-tab-${t.id}`}
            className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={tab === t.id ? { background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)' } : { background: 'transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-labelledby={`boing-pools-tab-${tab}`}>
        {tab === 'all' ? (
          <BoingPoolsTab
            key={initialQuery || 'pools'}
            pools={pools}
            initialQuery={initialQuery}
            onSwap={(c) => navigate(boingSwapPairHref(c.tokenA.id, c.tokenB.id))}
            onAddLiquidity={addLiquidity}
          />
        ) : (
          <BoingYourLiquidityTab pools={pools} addFor={addFor} onAddForConsumed={clearAddFor} />
        )}
      </div>
    </section>
  );
}
