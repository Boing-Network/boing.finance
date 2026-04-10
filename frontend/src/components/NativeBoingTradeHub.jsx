import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NativeAmmSwapPanel from './NativeAmmSwapPanel';
import NativeAmmLpVaultPanel from './NativeAmmLpVaultPanel';
import NativeLiquidityPositionsPanel from './NativeLiquidityPositionsPanel';
import NativeDexDirectoryRoutePanel from './NativeDexDirectoryRoutePanel';
import NativePoolsDirectoryPanel from './NativePoolsDirectoryPanel';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

const VALID_TAB_IDS = new Set(['swap', 'pools', 'route', 'liquidity']);

function parseTab(raw) {
  const t = (raw || '').trim().toLowerCase();
  return VALID_TAB_IDS.has(t) ? t : null;
}

const TABS = [
  { id: 'swap', label: 'Swap' },
  { id: 'pools', label: 'Pools' },
  { id: 'route', label: 'Smart route' },
  { id: 'liquidity', label: 'Your liquidity' },
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
    setTab('route');
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete('nativeTokenIn');
        n.delete('nativeTokenOut');
        n.set('nativeTradeTab', 'route');
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
    setTabAndUrl('route');
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
        {tab === 'swap' &&
          (loading ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-tertiary)' }}>
              Loading pool…
            </p>
          ) : effectivePoolHex?.trim() ? (
            <>
              <NativeAmmSwapPanel slippagePercent={slippagePercent} embedded />
              <div
                className="mt-4 pt-4 border-t rounded-b-lg -mx-4 sm:-mx-6 px-4 sm:px-6"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <strong className="text-[var(--text-primary)]">Other pools &amp; multihop</strong> — use{' '}
                  <span className="text-[var(--text-tertiary)]">Smart route</span> for factory-registered pairs and routes
                  across multiple pools (same signing flow as here).
                </p>
                <button
                  type="button"
                  onClick={() => setTabAndUrl('route')}
                  className="text-sm px-4 py-2.5 min-h-[44px] rounded-xl font-medium border transition hover:opacity-95"
                  style={{
                    borderColor: 'rgba(59, 130, 246, 0.45)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  Open Smart route
                </button>
              </div>
            </>
          ) : (
            <p
              className="text-sm py-6 text-center rounded-lg border px-4"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              No constant-product pool is configured for this RPC. Set build env or node hints, then refresh the page.
            </p>
          ))}
        {tab === 'pools' && (
          <NativePoolsDirectoryPanel onTradeThisPair={onTradeThisPair} focusPoolHex={poolsFocusPoolHex} />
        )}
        {tab === 'route' && (
          <NativeDexDirectoryRoutePanel
            slippagePercent={slippagePercent}
            embedded
            prefillKey={routePrefill.key}
            prefillTokenIn={routePrefill.tokenIn}
            prefillTokenOut={routePrefill.tokenOut}
          />
        )}
        {tab === 'liquidity' && (
          <>
            <NativeLiquidityPositionsPanel />
            <NativeAmmLpVaultPanel embedded />
          </>
        )}
      </div>
    </section>
  );
}
