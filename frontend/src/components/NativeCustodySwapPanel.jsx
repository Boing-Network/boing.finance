import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import {
  CUSTODY_APPROVAL,
  CUSTODY_ROUTER_HEX,
  executeCustodySwap,
  loadCustodyPools,
  planCustodySwap,
} from '../services/nativeDexCustodySwap';
import { getWindowBoingProvider, boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

const short = (h) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h || '—');

function label(hex, tokens) {
  const id = (hex || '').toLowerCase();
  const t = (tokens || []).find((x) => (x.id || '').toLowerCase() === id);
  return t?.symbol?.trim() || short(hex);
}

const APPROVAL_TEXT = {
  [CUSTODY_APPROVAL.IDLE]: 'Enter an amount to check the router allowance.',
  [CUSTODY_APPROVAL.CHECKING]: 'Checking allowance…',
  [CUSTODY_APPROVAL.SUFFICIENT]: 'Allowance covers this swap: one signature (swap).',
  [CUSTODY_APPROVAL.NEEDS_APPROVAL]: 'Approval needed: you will sign an approve for exactly this amount, then the swap.',
  [CUSTODY_APPROVAL.APPROVING]: 'Step 1/2: approving the router (waiting for inclusion)…',
  [CUSTODY_APPROVAL.APPROVED]: 'Approved. Step 2/2: sign the swap.',
  [CUSTODY_APPROVAL.SWAPPING]: 'Swapping (waiting for inclusion)…',
  [CUSTODY_APPROVAL.DONE]: 'Swap included.',
  [CUSTODY_APPROVAL.ERROR]: 'Could not read the allowance.',
};

/**
 * Swap through custody (v8/v9) pools via the custody router: exact-amount approve + slippage-bounded swap.
 * @param {{ slippagePercent?: number }} props
 */
export default function NativeCustodySwapPanel({ slippagePercent = 0.5 }) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { indexerPickerTokens } = useBoingNativeDexIntegration();
  const client = useMemo(() => getSharedBoingClient(), []);

  const [pools, setPools] = useState(null);
  const [poolsError, setPoolsError] = useState(null);
  const [poolHex, setPoolHex] = useState('');
  const [tokenInHex, setTokenInHex] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [approval, setApproval] = useState(CUSTODY_APPROVAL.IDLE);
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState(null);

  const loadPools = useCallback(async () => {
    setPoolsError(null);
    try {
      const ps = await loadCustodyPools(client);
      setPools(ps);
      if (ps.length && !ps.some((p) => p.poolHex === poolHex)) {
        setPoolHex(ps[0].poolHex);
        setTokenInHex(ps[0].tokenAHex);
      }
    } catch (e) {
      setPoolsError(e?.message || 'Could not list pools');
      setPools([]);
    }
  }, [client, poolHex]);

  useEffect(() => {
    loadPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pool = useMemo(() => (pools || []).find((p) => p.poolHex === poolHex) || null, [pools, poolHex]);
  const tokenOutHex = pool ? (tokenInHex === pool.tokenAHex ? pool.tokenBHex : pool.tokenAHex) : '';
  const amountBn = useMemo(() => {
    try {
      const t = amountIn.trim();
      if (!/^\d+$/.test(t)) return null;
      const n = BigInt(t);
      return n > 0n ? n : null;
    } catch {
      return null;
    }
  }, [amountIn]);

  const refreshPlan = useCallback(async () => {
    setPlanError(null);
    if (!pool || !amountBn || !account) {
      setPlan(null);
      setApproval(CUSTODY_APPROVAL.IDLE);
      return;
    }
    setApproval(CUSTODY_APPROVAL.CHECKING);
    try {
      const p = await planCustodySwap(client, {
        poolHex: pool.poolHex,
        tokenInHex,
        amountIn: amountBn,
        slippagePercent,
        senderHex: account,
      });
      setPlan(p);
      setApproval(p.approvalState === 'sufficient' ? CUSTODY_APPROVAL.SUFFICIENT : CUSTODY_APPROVAL.NEEDS_APPROVAL);
    } catch (e) {
      setPlan(null);
      setPlanError(e?.message || 'Quote failed');
      setApproval(CUSTODY_APPROVAL.ERROR);
    }
  }, [client, pool, tokenInHex, amountBn, account, slippagePercent]);

  useEffect(() => {
    if (busy) return undefined;
    const t = setTimeout(refreshPlan, 300);
    return () => clearTimeout(t);
  }, [refreshPlan, busy]);

  const onSwap = async () => {
    if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
      toast.error('Connect with Boing Express on Boing testnet (6913).');
      return;
    }
    const provider = pickExpressProvider(getWalletProvider);
    if (!provider) {
      toast.error(boingWalletMissingMessage());
      return;
    }
    if (!plan) return;
    setBusy(true);
    try {
      // Re-quote right before signing so min_out reflects current reserves.
      const fresh = await planCustodySwap(client, { poolHex: pool.poolHex, tokenInHex, amountIn: amountBn, slippagePercent, senderHex: account });
      setPlan(fresh);
      const res = await executeCustodySwap(client, fresh, {
        senderHex: account,
        onState: setApproval,
        signSimulateSubmit: (tx, o) =>
          boingExpressContractCallSignSimulateSubmit(provider, tx, {
            senderHex: account,
            waitForInclusion: o?.waitForInclusion,
            returnSubmitMeta: true,
          }),
      });
      setLastTx(res);
      toast.success(`Swapped ${amountBn} ${label(tokenInHex, indexerPickerTokens)}`);
      setAmountIn('');
      loadPools();
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
      setApproval(CUSTODY_APPROVAL.ERROR);
    } finally {
      setBusy(false);
    }
  };

  const box = { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' };
  return (
    <div className="rounded-lg border p-4 mb-4" style={box} data-testid="custody-swap-panel">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Custody pools (v8/v9)
        </h3>
        <button type="button" className="text-xs underline" onClick={loadPools} disabled={busy}>
          Refresh
        </button>
      </div>
      <p className="text-xs mb-3">
        Real token custody via router <code title={CUSTODY_ROUTER_HEX}>{short(CUSTODY_ROUTER_HEX)}</code>. Amounts are whole token units.
      </p>
      {pools === null && <p className="text-sm">Discovering pools…</p>}
      {poolsError && <p className="text-sm text-red-500">{poolsError}</p>}
      {pools && pools.length === 0 && !poolsError && <p className="text-sm">No custody pools listed yet.</p>}
      {pool && (
        <>
          <label className="block text-xs mb-1" htmlFor="custody-pool">Pool</label>
          <select
            id="custody-pool"
            className="w-full mb-3 rounded border px-2 py-1 bg-transparent"
            value={poolHex}
            disabled={busy}
            onChange={(e) => {
              const p = pools.find((x) => x.poolHex === e.target.value);
              setPoolHex(e.target.value);
              if (p) setTokenInHex(p.tokenAHex);
            }}
          >
            {pools.map((p) => (
              <option key={p.poolHex} value={p.poolHex}>
                {label(p.tokenAHex, indexerPickerTokens)} / {label(p.tokenBHex, indexerPickerTokens)} — reserves {String(p.reserveA)} : {String(p.reserveB)}
              </option>
            ))}
          </select>
          <div className="flex gap-2 items-end mb-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" htmlFor="custody-amount">
                Pay ({label(tokenInHex, indexerPickerTokens)})
              </label>
              <input
                id="custody-amount"
                inputMode="numeric"
                className="w-full rounded border px-2 py-1 bg-transparent"
                value={amountIn}
                disabled={busy}
                placeholder="0"
                onChange={(e) => setAmountIn(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              disabled={busy}
              title="Flip direction"
              onClick={() => setTokenInHex(tokenOutHex)}
            >
              ⇅
            </button>
          </div>
          <div className="text-sm mb-2">
            Receive ({label(tokenOutHex, indexerPickerTokens)}):{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{plan ? String(plan.amountOut) : '—'}</strong>
            {plan && (
              <span className="text-xs"> (min {String(plan.minOut)} at {slippagePercent}% slippage, fee {String(plan.feeBps)} bps)</span>
            )}
          </div>
          <div className="text-xs mb-3" data-testid="custody-approval-state" data-state={approval}>
            Allowance{plan ? `: ${String(plan.allowance)}` : ''} — {APPROVAL_TEXT[approval]}
          </div>
          {planError && <p className="text-xs text-red-500 mb-2">{planError}</p>}
          <button
            type="button"
            className="w-full rounded py-2 font-semibold"
            style={{ background: 'var(--accent-primary, #6366f1)', color: '#fff' }}
            disabled={busy || !plan}
            onClick={onSwap}
          >
            {busy ? 'Working…' : plan?.approvalState === 'needs_approval' ? 'Approve exact amount & swap' : 'Swap'}
          </button>
          {lastTx?.swap?.boingTxIdHex && (
            <p className="text-xs mt-2 break-all">
              {lastTx.approve?.boingTxIdHex && <>approve {lastTx.approve.boingTxIdHex}<br /></>}
              swap {lastTx.swap.boingTxIdHex}
            </p>
          )}
        </>
      )}
    </div>
  );
}