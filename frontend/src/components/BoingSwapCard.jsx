import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getBoingTokenBalance } from 'boing-sdk';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import {
  CUSTODY_APPROVAL,
  CUSTODY_ROUTER_HEX,
  executeCustodySwap,
  executeNativeBoingSwap,
  loadCustodyPools,
  loadCustodyTokenMetadata,
  planCustodySwap,
  planNativeBoingSwap,
} from '../services/nativeDexCustodySwap';
import {
  custodyTokenList,
  custodyTokensNeedingMetadata,
  filterPickerTokens,
  formatFee,
  formatRate,
  formatTokenAmount,
  isNativeBoingPool,
  minReceived,
  NATIVE_FEE_RESERVE,
  parseTokenAmount,
  pickBestCustodyPool,
  poolSideDecimals,
  sanitizeAmountInput,
  spotRateAfterFee,
  swapButtonState,
  toAmountInput,
  WBOING_HEX,
} from '../services/boingSwapQuote';
import { getWindowBoingProvider, boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { useWalletNativeValue } from '../hooks/useWalletNativeValue';
import { NATIVE_VALUE_MIN_EXPRESS_VERSION } from '../services/boingWalletNativeValue';

const SLIPPAGE_KEY = 'boingSwapSlippagePercent';
const SLIPPAGE_PRESETS = [0.1, 0.5, 1];

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

function TokenSelect({ side, token, tokens, balances, onPick, disabled, otherToken }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const { matches, unlistedAddress } = useMemo(() => filterPickerTokens(tokens, query), [tokens, query]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        data-testid={`swap-token-${side}`}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-base font-semibold border transition hover:opacity-90"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={token?.name}
      >
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)' }}
          aria-hidden
        >
          {(token?.symbol || '?').replace(/^t/, '').slice(0, 1).toUpperCase()}
        </span>
        {token?.symbol || 'Select'}
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border p-1 shadow-xl"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or paste address"
            aria-label="Search tokens"
            data-testid={`swap-token-search-${side}`}
            className="mb-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <ul
            role="listbox"
            aria-label={side === 'in' ? 'Token you pay' : 'Token you receive'}
            className="max-h-72 overflow-y-auto"
          >
            {matches.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={t.id === token?.id}
                  data-testid={`swap-token-option-${t.symbol}`}
                  onClick={() => {
                    onPick(t.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-[var(--secondary-bg)]"
                >
                  <span>
                    <span className="block font-semibold" style={{ color: 'var(--text-primary)' }}>{t.symbol}</span>
                    <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.name}</span>
                  </span>
                  <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {balances[t.id] != null ? formatTokenAmount(balances[t.id], t.decimals ?? 0, 4) : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && (
            <div className="px-3 py-3 text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="swap-token-no-pool">
              {unlistedAddress ? (
                <>
                  No pool yet —{' '}
                  <Link className="underline" to={`/create-pool?token=${unlistedAddress}${otherToken ? `&pair=${otherToken}` : ''}`}>
                    create one
                  </Link>
                  .
                </>
              ) : (
                'No token matches. Paste its address to check.'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One simple swap card for Boing L1: pick tokens, enter an amount, see the estimate and sign in Boing Express.
 * Routes through the best custody (v8/v9) pool for the pair. Native BOING (wBOING under the hood) routes to its
 * v10 pools and wraps / unwraps inside one signed batch. Raw pool / router details sit in "Route details".
 *
 * @param {{ slippagePercent?: number, prefill?: { key: number, tokenIn: string, tokenOut: string } }} props
 */
export default function BoingSwapCard({ slippagePercent = 0.5, prefill }) {
  const { chainId, walletType, isConnected, getWalletProvider, account, connectWalletWithProvider } = useWallet();
  const { indexerPickerTokens } = useBoingNativeDexIntegration();
  const client = useMemo(() => getSharedBoingClient(), []);

  const [pools, setPools] = useState(null);
  const [poolsError, setPoolsError] = useState(null);
  const [tokenInId, setTokenInId] = useState('');
  const [tokenOutId, setTokenOutId] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [balances, setBalances] = useState({});
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [busyState, setBusyState] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  const [slippage, setSlippage] = useState(() => {
    const s = Number(typeof localStorage !== 'undefined' ? localStorage.getItem(SLIPPAGE_KEY) : NaN);
    return Number.isFinite(s) && s > 0 && s <= 50 ? s : slippagePercent;
  });
  const [showSlippage, setShowSlippage] = useState(false);

  const connected = Boolean(isConnected && account);
  const wrongNetwork = connected && Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID;

  const loadPools = useCallback(async () => {
    setPoolsError(null);
    try {
      setPools(await loadCustodyPools(client));
    } catch (e) {
      setPoolsError(e?.message || 'Could not load pools');
      setPools([]);
    }
  }, [client]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // Tokens without a label in the (light) directory, e.g. a freshly deployed token: fetch their deploy metadata.
  const [extraTokenMeta, setExtraTokenMeta] = useState([]);
  const missingMetaKey = useMemo(
    () => custodyTokensNeedingMetadata(pools || [], indexerPickerTokens).sort().join(','),
    [pools, indexerPickerTokens],
  );
  useEffect(() => {
    if (!missingMetaKey) return undefined;
    let cancelled = false;
    loadCustodyTokenMetadata(client, missingMetaKey.split(',')).then((rows) => {
      if (!cancelled && rows.length) setExtraTokenMeta(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [client, missingMetaKey]);

  const tokens = useMemo(
    () => custodyTokenList(pools || [], [...(indexerPickerTokens || []), ...extraTokenMeta]),
    [pools, indexerPickerTokens, extraTokenMeta],
  );

  // Default pair: first pool's tokens (USDC -> tBOING on testnet); deep-link prefill wins when tradable.
  useEffect(() => {
    if (!tokens.length) return;
    const has = (id) => tokens.some((t) => t.id === (id || '').toLowerCase());
    if (prefill?.key && has(prefill.tokenIn) && has(prefill.tokenOut)) {
      setTokenInId(prefill.tokenIn.toLowerCase());
      setTokenOutId(prefill.tokenOut.toLowerCase());
      return;
    }
    if (!tokenInId || !has(tokenInId)) setTokenInId(tokens[0].id);
    if (!tokenOutId || !has(tokenOutId)) setTokenOutId((tokens[1] || tokens[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, prefill?.key]);

  const tokenIn = tokens.find((t) => t.id === tokenInId) || null;
  const tokenOut = tokens.find((t) => t.id === tokenOutId) || null;
  const decIn = tokenIn?.decimals ?? 0;
  const decOut = tokenOut?.decimals ?? 0;
  const amountIn = parseTokenAmount(amountRaw, decIn);
  const fmtIn = (n) => formatTokenAmount(n, decIn);
  const fmtOut = (n) => formatTokenAmount(n, decOut);
  const route = useMemo(
    () => (tokenIn && tokenOut ? pickBestCustodyPool(pools || [], tokenIn.id, tokenOut.id, amountIn) : null),
    [pools, tokenIn, tokenOut, amountIn]
  );

  const loadBalances = useCallback(async () => {
    if (!connected || !tokens.length) {
      setBalances({});
      return;
    }
    const next = {};
    await Promise.all(
      tokens.map(async (t) => {
        try {
          if (t.native) {
            // Native BOING: the account balance (base units), not a wBOING token balance.
            const acct = await client.getAccount(account);
            next[t.id] = BigInt(acct?.balance ?? 0);
          } else {
            next[t.id] = await getBoingTokenBalance(client, t.id, account);
          }
        } catch {
          next[t.id] = null;
        }
      })
    );
    setBalances(next);
  }, [client, connected, account, tokens]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const nativeRoute = isNativeBoingPool(route?.pool);
  // BOING pairs: one batch through the v10 pool (wrap / unwrap included); others: custody router (+ approval).
  const makePlan = () =>
    nativeRoute
      ? planNativeBoingSwap(client, {
          poolHex: route.pool.poolHex,
          tokenInHex: tokenIn.id,
          tokenOutHex: tokenOut.id,
          amountIn,
          slippagePercent: slippage,
          senderHex: account,
        })
      : planCustodySwap(client, {
          poolHex: route.pool.poolHex,
          tokenInHex: tokenIn.id,
          amountIn,
          slippagePercent: slippage,
          senderHex: account,
        });

  // Live plan (allowance, exact min out) once connected; local quote otherwise.
  useEffect(() => {
    setPlanError(null);
    if (!connected || wrongNetwork || !route?.pool || !amountIn || busyState) {
      if (!busyState) setPlan(null);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const p = await makePlan();
        if (!cancelled) setPlan(p);
      } catch (e) {
        if (!cancelled) {
          setPlan(null);
          setPlanError(e?.message || 'Quote failed');
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, connected, wrongNetwork, route?.pool, tokenIn, tokenOut, amountIn, slippage, account, busyState]);

  const amountOut = plan ? plan.amountOut : route?.quote?.amountOut ?? null;
  const minOut = plan ? plan.minOut : amountOut != null ? minReceived(amountOut, slippage) : null;
  const balanceIn = tokenIn ? balances[tokenIn.id] : null;
  const balanceOut = tokenOut ? balances[tokenOut.id] : null;

  // BOING in = BOING sent with the wBOING deposit: needs a wallet that signs call values (Express 0.1.19+).
  const expressProvider = useMemo(
    () => (connected && walletType === 'boingExpress' ? pickExpressProvider(getWalletProvider) : null),
    [connected, walletType, getWalletProvider]
  );
  const nativeValue = useWalletNativeValue(expressProvider, Boolean(expressProvider));
  const walletNeedsUpdate = Boolean(nativeRoute && tokenIn?.native && nativeValue && !nativeValue.supported);

  const button = swapButtonState({
    connected,
    wrongNetwork,
    walletNeedsUpdate,
    amountIn,
    balance: balanceIn ?? null,
    hasRoute: Boolean(route?.pool),
    needsApproval: plan?.approvalState === 'needs_approval',
    busyLabel: busyState,
    symbolIn: tokenIn?.symbol || '',
  });

  const pickToken = (side, id) => {
    if (side === 'in') {
      if (id === tokenOutId) setTokenOutId(tokenInId);
      setTokenInId(id);
    } else {
      if (id === tokenInId) setTokenInId(tokenOutId);
      setTokenOutId(id);
    }
  };

  const flip = () => {
    setTokenInId(tokenOutId);
    setTokenOutId(tokenInId);
    if (amountOut != null && amountOut > 0n) setAmountRaw(toAmountInput(amountOut, decOut));
  };

  const saveSlippage = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0 || n > 50) return;
    setSlippage(n);
    try {
      localStorage.setItem(SLIPPAGE_KEY, String(n));
    } catch {
      /* ignore */
    }
  };

  const onPrimary = async () => {
    if (button.kind === 'connect') {
      const provider = getWindowBoingProvider();
      if (!provider) {
        toast.error(boingWalletMissingMessage());
        return;
      }
      try {
        await connectWalletWithProvider(provider, 'boingExpress', BOING_NATIVE_L1_CHAIN_ID);
      } catch (e) {
        toast.error(formatBoingExpressRpcError(e));
      }
      return;
    }
    if (button.disabled) return;
    if (walletType !== 'boingExpress') {
      toast.error('Swaps on Boing are confirmed in Boing Express. Connect it from the header.');
      return;
    }
    const provider = pickExpressProvider(getWalletProvider);
    if (!provider) {
      toast.error(boingWalletMissingMessage());
      return;
    }
    setBusyState('Preparing…');
    try {
      // Re-quote right before signing so min out reflects current reserves.
      const fresh = await makePlan();
      setPlan(fresh);
      const signSimulateSubmit = (tx, o) =>
        boingExpressContractCallSignSimulateSubmit(provider, tx, {
          senderHex: account,
          waitForInclusion: o?.waitForInclusion,
          returnSubmitMeta: true,
        });
      const res = fresh.native
        ? await executeNativeBoingSwap(fresh, {
            signSimulateSubmit,
            onState: (s) => {
              if (s === CUSTODY_APPROVAL.SWAPPING) setBusyState(`Confirm in Boing Express (${fresh.steps.join(' → ')})…`);
            },
          })
        : await executeCustodySwap(client, fresh, {
            senderHex: account,
            onState: (s) => {
              if (s === CUSTODY_APPROVAL.APPROVING) setBusyState(`Approve ${tokenIn.symbol} in Boing Express (1/2)…`);
              else if (s === CUSTODY_APPROVAL.SWAPPING)
                setBusyState(fresh.approveTx ? 'Confirm the swap in Boing Express (2/2)…' : 'Confirm in Boing Express…');
            },
            signSimulateSubmit,
          });
      setLastTx({ ...res, amountIn, symbolIn: tokenIn.symbol, decIn, amountOut: fresh.amountOut, symbolOut: tokenOut.symbol, decOut });
      toast.success(`Swapped ${fmtIn(amountIn)} ${tokenIn.symbol} for ~${fmtOut(fresh.amountOut)} ${tokenOut.symbol}`);
      setAmountRaw('');
      setPlan(null);
      await Promise.all([loadPools(), loadBalances()]);
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusyState(null);
    }
  };

  const panel = { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' };
  const muted = { color: 'var(--text-tertiary)' };
  const impact = route?.quote?.priceImpactBps ?? null;
  const impactColor = impact == null ? undefined : impact >= 500 ? '#f87171' : impact >= 100 ? '#fbbf24' : undefined;
  const busy = Boolean(busyState);

  return (
    <div className="mx-auto w-full max-w-[480px]" data-testid="boing-swap-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Swap</h2>
        <div className="relative">
          <button
            type="button"
            data-testid="swap-slippage-button"
            onClick={() => setShowSlippage((s) => !s)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm hover:bg-[var(--secondary-bg)]"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Slippage settings"
            aria-expanded={showSlippage}
          >
            <span className="tabular-nums">{slippage}%</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {showSlippage && (
            <div
              className="absolute right-0 z-30 mt-2 w-64 rounded-xl border p-3 shadow-xl"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
              data-testid="swap-slippage-panel"
            >
              <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Max slippage</p>
              <div className="flex gap-2">
                {SLIPPAGE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => saveSlippage(p)}
                    className="flex-1 rounded-lg border px-2 py-1 text-sm"
                    style={{
                      borderColor: slippage === p ? 'var(--finance-primary)' : 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p}%
                  </button>
                ))}
                <input
                  aria-label="Custom slippage percent"
                  inputMode="decimal"
                  className="w-16 rounded-lg border bg-transparent px-2 py-1 text-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Custom"
                  onBlur={(e) => e.target.value && saveSlippage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveSlippage(e.currentTarget.value)}
                />
              </div>
              <p className="mt-2 text-xs" style={muted}>The swap reverts if you would get less than this.</p>
            </div>
          )}
        </div>
      </div>

      {/* You pay */}
      <div className="rounded-2xl border p-4" style={panel}>
        <div className="mb-1 flex items-center justify-between text-sm" style={muted}>
          <span>You pay</span>
          {connected && tokenIn && (
            <span data-testid="swap-balance-in">
              Balance: {balanceIn != null ? fmtIn(balanceIn) : '…'}
              {balanceIn != null && balanceIn > 0n && (
                <button
                  type="button"
                  className="ml-2 rounded px-1.5 py-0.5 text-xs font-semibold"
                  style={{ color: 'var(--finance-primary)' }}
                  onClick={() => {
                    // Native BOING also pays the network fee: keep a small reserve back.
                    const max = tokenIn.native ? (balanceIn > NATIVE_FEE_RESERVE ? balanceIn - NATIVE_FEE_RESERVE : 0n) : balanceIn;
                    setAmountRaw(max > 0n ? toAmountInput(max, decIn) : '');
                  }}
                  disabled={busy}
                  data-testid="swap-max"
                >
                  Max
                </button>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            data-testid="swap-amount-in"
            aria-label="Amount you pay"
            inputMode={decIn ? 'decimal' : 'numeric'}
            autoComplete="off"
            placeholder="0"
            value={amountRaw}
            disabled={busy}
            onChange={(e) => setAmountRaw(sanitizeAmountInput(e.target.value, decIn))}
            className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <TokenSelect side="in" token={tokenIn} tokens={tokens} balances={balances} onPick={(id) => pickToken('in', id)} disabled={busy} otherToken={tokenOut?.id} />
        </div>
        <p className="mt-1 text-xs" style={muted}>{tokenIn?.name || ' '}{decIn ? '' : ' · whole units'}</p>
      </div>

      <div className="relative z-10 -my-3 flex justify-center">
        <button
          type="button"
          data-testid="swap-flip"
          onClick={flip}
          disabled={busy}
          className="rounded-xl border-4 p-2 transition hover:rotate-180"
          style={{ borderColor: 'var(--bg-card)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          aria-label="Switch tokens"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* You receive */}
      <div className="rounded-2xl border p-4" style={panel}>
        <div className="mb-1 flex items-center justify-between text-sm" style={muted}>
          <span>You receive (estimated)</span>
          {connected && tokenOut && <span>Balance: {balanceOut != null ? fmtOut(balanceOut) : '…'}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="min-w-0 flex-1 truncate text-3xl font-semibold tabular-nums"
            style={{ color: amountOut != null ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            data-testid="swap-amount-out"
          >
            {amountOut != null ? fmtOut(amountOut) : '0'}
          </div>
          <TokenSelect side="out" token={tokenOut} tokens={tokens} balances={balances} onPick={(id) => pickToken('out', id)} disabled={busy} otherToken={tokenIn?.id} />
        </div>
        <p className="mt-1 text-xs" style={muted}>{tokenOut?.name || ' '}</p>
      </div>

      {/* Quote details */}
      {amountIn && route?.quote && (
        <dl className="mt-3 space-y-1.5 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--border-color)' }} data-testid="swap-quote">
          <div className="flex justify-between">
            <dt style={muted}>Rate</dt>
            <dd style={{ color: 'var(--text-primary)' }}>
              1 {tokenIn.symbol} ≈ {formatRate(1, spotRateAfterFee(route?.pool, tokenIn.id)) ?? '—'} {tokenOut.symbol}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={muted}>Price impact</dt>
            <dd style={{ color: impactColor || 'var(--text-primary)' }} data-testid="swap-price-impact">
              {impact != null ? (impact < 1 ? '<0.01%' : `${(impact / 100).toFixed(2)}%`) : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={muted}>Minimum received ({slippage}% slippage)</dt>
            <dd className="whitespace-nowrap pl-2 text-right" style={{ color: 'var(--text-primary)' }} data-testid="swap-min-out">
              {minOut != null ? `${fmtOut(minOut)} ${tokenOut.symbol}` : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt style={muted}>Fee ({(route.quote.feeBps / 100).toFixed(2)}%)</dt>
            <dd style={{ color: 'var(--text-primary)' }}>
              {formatFee(amountIn, route.quote.feeBps, decIn) ?? '—'} {tokenIn.symbol}
            </dd>
          </div>
        </dl>
      )}
      {/* Only when flooring to whole units costs >= 1% (not for the real price impact of a large trade). */}
      {amountIn && (route?.quote?.roundingLossBps ?? 0) >= 100 && (
        <p className="mt-2 text-xs" style={muted} data-testid="swap-rounding-hint">
          Tokens here are whole units, so very small trades lose more to rounding. A larger amount gets closer to the
          quoted rate.
        </p>
      )}
      {pools && !pools.length && !poolsError && (
        <p className="mt-3 text-sm" style={muted}>No swap pools are live on this network yet.</p>
      )}
      {(poolsError || planError) && (
        <p className="mt-3 text-sm text-red-400" role="alert">{poolsError || planError}</p>
      )}

      <button
        type="button"
        data-testid="swap-primary"
        data-kind={button.kind}
        onClick={onPrimary}
        disabled={button.disabled}
        className="mt-4 w-full rounded-2xl py-4 text-lg font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}
      >
        {button.label}
      </button>
      {button.kind === 'no_route' && tokenIn && tokenOut && (
        <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="swap-no-pool">
          No pool yet —{' '}
          <Link className="underline" style={{ color: 'var(--finance-primary)' }} to={`/create-pool?token=${tokenOut.id}&pair=${tokenIn.id}`}>
            create one
          </Link>
        </p>
      )}
      {nativeRoute && amountIn && button.kind === 'swap' && (
        <p className="mt-2 text-center text-xs" style={muted} data-testid="swap-native-note">
          One confirmation in Boing Express:{' '}
          {tokenIn?.native ? 'wraps your BOING, approves and swaps' : 'approves, swaps and unwraps to BOING'} in a single transaction.
        </p>
      )}
      {button.kind === 'update_wallet' && (
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }} data-testid="swap-update-wallet">
          Swapping BOING sends it with the wrap step, which needs Boing Express {NATIVE_VALUE_MIN_EXPRESS_VERSION} or newer
          {nativeValue?.version ? ` (yours: ${nativeValue.version})` : ' (yours is older)'}. Update Boing Express, or reload the unpacked
          extension, then refresh this page. Selling tokens for BOING works with your current version.
        </p>
      )}
      {button.kind === 'approve_swap' && (
        <p className="mt-2 text-center text-xs" style={muted}>
          First time swapping {tokenIn?.symbol}: Boing Express asks you to approve exactly this amount, then to confirm the swap.
        </p>
      )}

      {lastTx?.swap?.boingTxIdHex && (
        <p className="mt-3 text-center text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="swap-success">
          Swapped {formatTokenAmount(lastTx.amountIn, lastTx.decIn ?? 0)} {lastTx.symbolIn} for ~
          {formatTokenAmount(lastTx.amountOut, lastTx.decOut ?? 0)} {lastTx.symbolOut}.{' '}
          <a
            href={`https://boing.observer/tx/${lastTx.swap.boingTxIdHex}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--finance-primary)' }}
          >
            View on Boing Observer
          </a>
        </p>
      )}

      {route?.pool && (
        <details className="mt-4 text-xs" style={muted} data-testid="swap-route-details">
          <summary className="cursor-pointer select-none">Route details</summary>
          <dl className="mt-2 space-y-1 break-all">
            <div><dt className="inline">Route: </dt><dd className="inline">{tokenIn?.symbol} → {tokenOut?.symbol}, best pool ({route.pool.feeBps ?? 30} bps fee)</dd></div>
            <div><dt className="inline">Pool: </dt><dd className="inline font-mono">{route.pool.poolHex}</dd></div>
            <div><dt className="inline">{tokenIn?.symbol}: </dt><dd className="inline font-mono">{tokenIn?.id}</dd></div>
            <div><dt className="inline">{tokenOut?.symbol}: </dt><dd className="inline font-mono">{tokenOut?.id}</dd></div>
            {nativeRoute ? (
              <div>
                <dt className="inline">BOING: </dt>
                <dd className="inline">
                  wrapped / unwrapped automatically (wBOING <span className="font-mono">{WBOING_HEX}</span>), pool called directly
                </dd>
              </div>
            ) : (
              <div><dt className="inline">Router: </dt><dd className="inline font-mono">{CUSTODY_ROUTER_HEX}</dd></div>
            )}
            <div>
              <dt className="inline">Pool reserves: </dt>
              <dd className="inline">
                {formatTokenAmount(route.pool.reserveA, poolSideDecimals(route.pool, 'a'))}{' '}
                {tokens.find((t) => t.id === route.pool.tokenAHex?.toLowerCase())?.symbol} /{' '}
                {formatTokenAmount(route.pool.reserveB, poolSideDecimals(route.pool, 'b'))}{' '}
                {tokens.find((t) => t.id === route.pool.tokenBHex?.toLowerCase())?.symbol}
              </dd>
            </div>
          </dl>
        </details>
      )}
    </div>
  );
}
