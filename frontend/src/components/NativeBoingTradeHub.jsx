import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NativeAmmSwapPanel from './NativeAmmSwapPanel';
import BoingSwapCard from './BoingSwapCard';
import NativeAmmLpVaultPanel from './NativeAmmLpVaultPanel';
import NativeLpVaultV2Panel from './NativeLpVaultV2Panel';
import NativeLiquidityPositionsPanel from './NativeLiquidityPositionsPanel';
import NativeDexDirectoryRoutePanel from './NativeDexDirectoryRoutePanel';
import NativeDexIndexerSettingsStrip from './NativeDexIndexerSettingsStrip';
import BoingL1DexReadinessPanel from './BoingL1DexReadinessPanel';
import NativePoolsDirectoryPanel from './NativePoolsDirectoryPanel';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

const VALID_TAB_IDS = new Set(['swap', 'pools', 'liquidity', 'advanced']);

/** Old deep links (`nativeTradeTab=route`) land on Advanced, where Smart route now lives. */
function parseTab(raw) {
  const t = (raw || '').trim().toLowerCase();
  if (t === 'route') return 'advanced';
  return VALID_TAB_IDS.has(t) ? t : null;
}

/** Swap is the one simple card; readiness, legacy ledger pool, smart route and indexer settings sit in Advanced. */
const TABS = [
  { id: 'swap', label: 'Swap' },
  { id: 'pools', label: 'Pools' },
  { id: 'liquidity', label: 'Your liquidity' },
  { id: 'advanced', label: 'Advanced' },
];

/**
 * Boing L1 trading surface: swap, pool directory, routing, and LP positions (Uniswap-style tabs).
 * Deep link: `/swap?nativeTradeTab=route&nativeTokenIn=0x…&nativeTokenOut=0x…#boing-native-trade`
 * Pools focus: `?nativePool=0x…64hex…` (consumed; opens Pools tab and selects that pool in the chart).
 *
 * @param {{ slippagePercent?: number }} props
 */
export default function NativeBoingTradeHub({ slippagePercent = 0.5 }) {
  const { chainId } = useWallet();
  const { effectivePoolHex, loading } = useBoingNativeDexIntegration();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => parseTab(searchParams.get('nativeTradeTab')) || 'swap');
  const routePrefillSeq = useRef(0);
  const [routePrefill, setRoutePrefill] = useState(
    /** @type {{ key: number, tokenIn: string, tokenOut: string }} */ ({ key: 0, tokenIn: '', tokenOut: '' })
  );
  const [poolsFocusPoolHex, setPoolsFocusPoolHex] = useState('');

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

  useEffect(() => {
    const raw = searchParams.get('nativePool')?.trim();
    if (!raw || !/^0x[0-9a-fA-F]{64}$/i.test(raw)) return;
    setPoolsFocusPoolHex(`0x${raw.slice(2).toLowerCase()}`);
    setTab('pools');
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete('nativePool');
        n.set('nativeTradeTab', 'pools');
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
              <button type="button" className="underline" onClick={() => setTabAndUrl('pools')}>Browse pools</button>
              {' '}or try{' '}
              <button type="button" className="underline" onClick={() => setTabAndUrl('advanced')}>Advanced</button>
              {' '}(smart route, legacy pool).
            </p>
          </>
        )}
        {tab === 'pools' && (
          <NativePoolsDirectoryPanel onTradeThisPair={onTradeThisPair} focusPoolHex={poolsFocusPoolHex} />
        )}
        {tab === 'liquidity' && (
          <>
            <NativeLiquidityPositionsPanel />
            <NativeLpVaultV2Panel slippagePercent={slippagePercent} />
            <NativeAmmLpVaultPanel embedded />
          </>
        )}
        {tab === 'advanced' && (
          <div className="space-y-6" data-testid="boing-trade-advanced">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Developer and power-user tools. Everyday swaps belong on the Swap tab.
            </p>
            <BoingL1DexReadinessPanel compact />
            <section>
              <h3 className="mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Smart route (multi-hop)</h3>
              <NativeDexDirectoryRoutePanel
                slippagePercent={slippagePercent}
                embedded
                prefillKey={routePrefill.key}
                prefillTokenIn={routePrefill.tokenIn}
                prefillTokenOut={routePrefill.tokenOut}
              />
            </section>
            <section>
              <h3 className="mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Legacy ledger pool (v1)</h3>
              {loading ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading pool…</p>
              ) : effectivePoolHex?.trim() ? (
                <NativeAmmSwapPanel slippagePercent={slippagePercent} embedded />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No legacy pool on this network.</p>
              )}
            </section>
            <NativeDexIndexerSettingsStrip />
          </div>
        )}
      </div>
    </section>
  );
}
