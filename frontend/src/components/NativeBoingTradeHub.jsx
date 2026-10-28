import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NativeAmmSwapPanel from './NativeAmmSwapPanel';
import BoingSwapCard from './BoingSwapCard';
import NativeAmmLpVaultPanel from './NativeAmmLpVaultPanel';
import NativeLpVaultV2Panel from './NativeLpVaultV2Panel';
import NativeLiquidityPositionsPanel from './NativeLiquidityPositionsPanel';
import NativeDexDirectoryRoutePanel from './NativeDexDirectoryRoutePanel';
import NativeDexIndexerSettingsStrip from './NativeDexIndexerSettingsStrip';
import BoingL1DexReadinessPanel from './BoingL1DexReadinessPanel';
import NativePoolsDirectoryPanel from './NativePoolsDirectoryPanel';
import { CUSTODY_ROUTER_HEX } from '../services/nativeDexCustodySwap';
import toast from 'react-hot-toast';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

const VALID_TAB_IDS = new Set(['swap', 'advanced']);

/** Old deep links (`nativeTradeTab=route`) land on Advanced, where Smart route now lives. */
function parseTab(raw) {
  const t = (raw || '').trim().toLowerCase();
  if (t === 'route') return 'advanced';
  return VALID_TAB_IDS.has(t) ? t : null;
}

/**
 * Swap is the one simple card; readiness, legacy ledger pool, smart route and indexer settings sit in Advanced.
 * Pool cards and Your liquidity live on the Pools page (/pools, /pools?tab=liquidity); old `nativeTradeTab=pools`,
 * `nativeTradeTab=liquidity`, `addPool=` and `nativePool=` links redirect there (App.jsx).
 */
const TABS = [
  { id: 'swap', label: 'Swap' },
  { id: 'advanced', label: 'Advanced' },
];

function CopyChip({ label, value }) {
  if (!value || !/^0x[0-9a-f]{64}$/i.test(String(value))) return null;
  const v = String(value);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs"
      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
      title={v}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(v);
          toast.success(`${label} copied`);
        } catch {
          toast.error('Could not copy');
        }
      }}
    >
      <span>{label}</span>
      <code className="font-mono">{`${v.slice(0, 8)}…${v.slice(-6)}`}</code>
      <span aria-hidden>⧉</span>
    </button>
  );
}

/** One Advanced section: title, one-line description, optional copy chips, then the tool. */
function AdvSection({ id, title, description, copies = [], children }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }} data-testid={`advanced-${id}`}>
      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
      {copies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {copies.map(([l, v]) => (
            <CopyChip key={l} label={l} value={v} />
          ))}
        </div>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Boing L1 trading surface: the swap card, plus Advanced (pool directory, routing, legacy pool, readiness, indexer).
 * Deep link: `/swap?nativeTokenIn=0x…&nativeTokenOut=0x…#boing-native-trade` (prefills the swap card).
 *
 * @param {{ slippagePercent?: number }} props
 */
export default function NativeBoingTradeHub({ slippagePercent = 0.5 }) {
  const { chainId: walletChainId } = useWallet();
  const { isBoing } = useChainType();
  // Without a wallet, follow the header's chain family (Boing testnet by default).
  const chainId = walletChainId ?? (isBoing ? BOING_NATIVE_L1_CHAIN_ID : walletChainId);
  const { effectivePoolHex, effectiveFactoryHex, loading } = useBoingNativeDexIntegration();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => parseTab(searchParams.get('nativeTradeTab')) || 'swap');
  const routePrefillSeq = useRef(0);
  const [routePrefill, setRoutePrefill] = useState(
    /** @type {{ key: number, tokenIn: string, tokenOut: string }} */ ({ key: 0, tokenIn: '', tokenOut: '' })
  );

  useEffect(() => {
    const fromUrl = parseTab(searchParams.get('nativeTradeTab'));
    if (fromUrl) setTab(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    const tin = searchParams.get('nativeTokenIn');
    const tout = searchParams.get('nativeTokenOut');
    if (!tin?.trim() && !tout?.trim()) return;
    routePrefillSeq.current += 1;
    setRoutePrefill({
      key: routePrefillSeq.current,
      tokenIn: (tin || '').trim(),
      tokenOut: (tout || '').trim(),
    });
    setTab('swap');
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete('nativeTokenIn');
        n.delete('nativeTokenOut');
        n.set('nativeTradeTab', 'swap');
        return n;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  const setTabAndUrl = useCallback(
    (next) => {
      const id = parseTab(next) || 'swap';
      setTab(id);
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set('nativeTradeTab', id);
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const onTradeThisPair = useCallback((tokenAHex, tokenBHex) => {
    routePrefillSeq.current += 1;
    setRoutePrefill({
      key: routePrefillSeq.current,
      tokenIn: (tokenAHex || '').trim(),
      tokenOut: (tokenBHex || '').trim(),
    });
    // The swap card trades the pair when a custody pool exists; otherwise Advanced > Smart route has the prefill.
    setTabAndUrl('swap');
  }, [setTabAndUrl]);

  const didScrollToTradeHash = useRef(false);
  useLayoutEffect(() => {
    if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return;
    if (didScrollToTradeHash.current) return;
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#boing-native-trade') return;
    didScrollToTradeHash.current = true;
    requestAnimationFrame(() => {
      document.getElementById('boing-native-trade')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [chainId]);

  if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return null;

  return (
    <section
      id="boing-native-trade"
      className="mb-8 rounded-2xl border overflow-hidden"
      style={{
        borderColor: 'rgba(59, 130, 246, 0.35)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: '0 4px 24px var(--shadow)',
      }}
    >
      <div
        className="flex flex-nowrap gap-1 p-2 border-b overflow-x-auto overscroll-x-contain"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        role="tablist"
        aria-label="Boing trading"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTabAndUrl(t.id)}
            className={`shrink-0 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={
              tab === t.id
                ? { background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)' }
                : { background: 'transparent' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6" role="tabpanel">
        {tab === 'swap' && (
          <>
            <BoingSwapCard slippagePercent={slippagePercent} prefill={routePrefill} />
            <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Pair not listed?{' '}
              <Link className="underline" to="/pools" data-testid="swap-browse-pools">Browse pools</Link>
              {' '}(your liquidity is there too:{' '}
              <Link className="underline" to="/pools?tab=liquidity" data-testid="swap-your-liquidity">Your liquidity</Link>) or try{' '}
              <button type="button" className="underline" onClick={() => setTabAndUrl('advanced')}>Advanced</button>
              {' '}(smart route, legacy pool).
            </p>
          </>
        )}
                {tab === 'advanced' && (
          <div className="space-y-4" data-testid="boing-trade-advanced">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Developer and power-user tools. Everyday swaps are on the Swap tab; pool cards and your liquidity are on the{' '}
              <Link className="underline" to="/pools">Pools page</Link>.
            </p>
            <AdvSection
              id="contracts"
              title="Pool contracts & factory"
              description="Every pool registered with the factory, pair count, reserves chart and developer stats."
              copies={[
                ['Factory', effectiveFactoryHex],
                ['Swap router', CUSTODY_ROUTER_HEX],
              ]}
            >
              <NativePoolsDirectoryPanel onTradeThisPair={onTradeThisPair} />
            </AdvSection>
            <AdvSection id="routing" title="Smart routing" description="Multi-hop quotes across several pools when no direct pair exists.">
              <NativeDexDirectoryRoutePanel
                slippagePercent={slippagePercent}
                embedded
                prefillKey={routePrefill.key}
                prefillTokenIn={routePrefill.tokenIn}
                prefillTokenOut={routePrefill.tokenOut}
              />
            </AdvSection>
            <AdvSection
              id="legacy"
              title="Legacy pool"
              description="The original ledger pool (v1) and its LP vaults. Kept for existing positions."
              copies={[['Legacy pool', effectivePoolHex]]}
            >
              {loading ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading pool…</p>
              ) : effectivePoolHex?.trim() ? (
                <div className="space-y-4">
                  <NativeAmmSwapPanel slippagePercent={slippagePercent} embedded />
                  <NativeLiquidityPositionsPanel />
                  <NativeLpVaultV2Panel slippagePercent={slippagePercent} />
                  <NativeAmmLpVaultPanel embedded />
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No legacy pool on this network.</p>
              )}
            </AdvSection>
            <AdvSection id="readiness" title="Network readiness" description="Which DEX contracts the connected network advertises and whether they respond.">
              <BoingL1DexReadinessPanel compact />
            </AdvSection>
            <AdvSection id="indexer" title="Indexer" description="Optional indexer URL used for pool and token lists, history and stats.">
              <NativeDexIndexerSettingsStrip />
            </AdvSection>
          </div>
        )}
      </div>
    </section>
  );
}
