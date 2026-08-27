import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { boingGetContractStorage } from '../services/boingTestnetRpc';
import {
  NATIVE_AMM_RESERVE_A_KEY,
  NATIVE_AMM_RESERVE_B_KEY,
  encodeNativeAmmAddLiquidityCalldataHex,
  encodeNativeAmmRemoveLiquidityCalldataHex,
  parseNativeAmmReserveU128,
} from '../services/nativeAmmCalldata';
import { nativeAccountsAccessListJson } from '../services/nativeAmmAccessList';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { normalizeNativeVmTokenId32 } from '../services/nativeVmTokenRegistry';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

function parsePositiveBigInt(raw) {
  try {
    const t = (raw || '').trim();
    if (!t) return null;
    const n = BigInt(t);
    return n > 0n ? n : null;
  } catch {
    return null;
  }
}

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 18) return t || '—';
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

/**
 * Add / remove on an existing native CP pool (canonical, directory venue, or pasted AccountId).
 */
export default function NativeBoingManagePoolPanel() {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { effectivePoolHex, venues, explorerBaseUrl } = useBoingNativeDexIntegration();
  const [searchParams] = useSearchParams();
  const [poolHex, setPoolHex] = useState(() => searchParams.get('pool') || effectivePoolHex || '');
  const [addAmountA, setAddAmountA] = useState('');
  const [addAmountB, setAddAmountB] = useState('');
  const [removeLp, setRemoveLp] = useState('');
  const [reserveA, setReserveA] = useState(null);
  const [reserveB, setReserveB] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (effectivePoolHex && !poolHex) setPoolHex(effectivePoolHex);
  }, [effectivePoolHex, poolHex]);

  const pool = normalizeNativeVmTokenId32(poolHex);
  const venue = useMemo(() => {
    if (!pool) return null;
    return venues.find((v) => (v.poolHex || '').toLowerCase() === pool) || null;
  }, [venues, pool]);

  const loadReserves = useCallback(async () => {
    if (!pool) return;
    setLoadError(null);
    try {
      const [va, vb] = await Promise.all([
        boingGetContractStorage(pool, NATIVE_AMM_RESERVE_A_KEY),
        boingGetContractStorage(pool, NATIVE_AMM_RESERVE_B_KEY),
      ]);
      setReserveA(parseNativeAmmReserveU128(va));
      setReserveB(parseNativeAmmReserveU128(vb));
    } catch (e) {
      setLoadError(e?.message || 'Failed to load pool reserves');
      setReserveA(null);
      setReserveB(null);
    }
  }, [pool]);

  useEffect(() => {
    loadReserves();
  }, [loadReserves]);

  const addA = useMemo(() => parsePositiveBigInt(addAmountA), [addAmountA]);
  const addB = useMemo(() => parsePositiveBigInt(addAmountB), [addAmountB]);
  const removeBn = useMemo(() => parsePositiveBigInt(removeLp), [removeLp]);

  const callPool = async (calldata) => {
    if (!isBoingTestnetChainId(chainId) || walletType !== 'boingExpress' || !isConnected) {
      throw new Error('Connect with Boing Express on Boing testnet (6913).');
    }
    if (!pool) throw new Error('Enter a 32-byte pool account id.');
    const p = pickExpressProvider(getWalletProvider);
    if (!p) throw new Error('Boing Express provider not found.');
    const access = nativeAccountsAccessListJson([
      account,
      pool,
      venue?.tokenAHex,
      venue?.tokenBHex,
    ]);
    return boingExpressContractCallSignSimulateSubmit(p, {
      type: 'contract_call',
      contract: pool,
      calldata,
      ...(access ? { access_list: access } : {}),
    });
  };

  const onAdd = async () => {
    if (addA == null || addB == null) {
      toast.error('Enter positive integer amounts for both reserves.');
      return;
    }
    setBusy(true);
    try {
      const hash = await callPool(encodeNativeAmmAddLiquidityCalldataHex(addA, addB, 0n));
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      setAddAmountA('');
      setAddAmountB('');
      await loadReserves();
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e) || e?.message);
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (removeBn == null) {
      toast.error('Enter a positive LP amount to burn.');
      return;
    }
    setBusy(true);
    try {
      const hash = await callPool(encodeNativeAmmRemoveLiquidityCalldataHex(removeBn, 0n, 0n));
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      setRemoveLp('');
      await loadReserves();
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e) || e?.message);
    } finally {
      setBusy(false);
    }
  };

  if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return null;

  const fieldClass = 'w-full text-sm p-2 rounded-lg border font-mono';
  const fieldStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <section
      className="rounded-xl border p-5 text-left mb-6"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(45, 212, 191, 0.45)' }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Add or remove on a native pool
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Works on the published canonical pool, a directory venue, or a pool AccountId you deployed.{' '}
        <Link to="/create-pool" className="text-cyan-400 underline">
          Create Pool
        </Link>{' '}
        if the pair does not exist yet. First-seed / MVP add_liquidity may not mint a transferable LP token — use{' '}
        <strong>Remove LP</strong> only when this pool actually minted shares to you.
      </p>

      {venues.length > 0 && (
        <label className="block text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Discovered pools
          <select
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={pool || ''}
            onChange={(e) => setPoolHex(e.target.value)}
          >
            <option value="">Select a pool…</option>
            {venues.map((v) => (
              <option key={v.poolHex} value={v.poolHex}>
                {shortHex(v.poolHex)} · {shortHex(v.tokenAHex)}/{shortHex(v.tokenBHex)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Pool account id
        <input
          className={`${fieldClass} mt-1`}
          style={fieldStyle}
          value={poolHex}
          onChange={(e) => setPoolHex(e.target.value.trim())}
          placeholder="0x… 32-byte AccountId"
          spellCheck={false}
        />
      </label>

      {loadError && (
        <p className="text-xs mb-2" style={{ color: '#f87171' }}>
          {loadError}
        </p>
      )}
      {reserveA != null && reserveB != null && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Reserves: {reserveA.toString()} / {reserveB.toString()}
          {explorerBaseUrl && pool ? (
            <>
              {' '}
              ·{' '}
              <a className="text-cyan-400 underline" href={`${String(explorerBaseUrl).replace(/\/+$/, '')}/account/${pool}`} target="_blank" rel="noopener noreferrer">
                observer
              </a>
            </>
          ) : null}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Add reserve A (integer)
          <input
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={addAmountA}
            onChange={(e) => setAddAmountA(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Add reserve B (integer)
          <input
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={addAmountB}
            onChange={(e) => setAddAmountB(e.target.value.replace(/\D/g, ''))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !pool}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--finance-green-mid, #16a34a)' }}
        >
          {busy ? 'Working…' : 'Add liquidity'}
        </button>
      </div>

      <label className="text-xs block mb-2" style={{ color: 'var(--text-tertiary)' }}>
        LP amount to burn
        <input
          className={`${fieldClass} mt-1 max-w-xs`}
          style={fieldStyle}
          value={removeLp}
          onChange={(e) => setRemoveLp(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      <button
        type="button"
        onClick={onRemove}
        disabled={busy || !pool}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: '#b91c1c' }}
      >
        Remove LP
      </button>
    </section>
  );
}
