import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { getContractAddress } from '../config/contracts';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { boingGetContractStorage } from '../services/boingTestnetRpc';
import {
  NATIVE_AMM_RESERVE_A_KEY,
  NATIVE_AMM_RESERVE_B_KEY,
  encodeNativeAmmSwapCalldataHex,
  constantProductAmountOut,
  parseNativeAmmReserveU128,
} from '../services/nativeAmmCalldata';
import { boingExpressSendTransaction } from '../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

/**
 * In-app swap against configured native CP pool (`REACT_APP_BOING_NATIVE_AMM_POOL`).
 * Requires Boing Express on chain 6913. Reserves are ledger units (u64-safe); no ERC-20 legs.
 */
export default function NativeAmmSwapPanel({ slippagePercent = 0.5 }) {
  const { chainId, walletType, isConnected, getWalletProvider } = useWallet();
  const pool = getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeConstantProductPool');

  const [reserveA, setReserveA] = useState(null);
  const [reserveB, setReserveB] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [direction, setDirection] = useState('a_to_b');
  const [amountIn, setAmountIn] = useState('');
  const [busy, setBusy] = useState(false);

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

  const amountInBn = useMemo(() => {
    try {
      const t = (amountIn || '').trim();
      if (!t) return null;
      const n = BigInt(t);
      return n > 0n ? n : null;
    } catch {
      return null;
    }
  }, [amountIn]);

  const amountOutEst = useMemo(() => {
    if (reserveA == null || reserveB == null || amountInBn == null) return null;
    if (direction === 'a_to_b') {
      return constantProductAmountOut(reserveA, reserveB, amountInBn);
    }
    return constantProductAmountOut(reserveB, reserveA, amountInBn);
  }, [reserveA, reserveB, amountInBn, direction]);

  const minOutBn = useMemo(() => {
    if (amountOutEst == null) return null;
    const bps = Math.min(10_000, Math.max(0, Math.round(Number(slippagePercent) * 100)));
    const num = 10_000n - BigInt(bps);
    return (amountOutEst * num) / 10_000n;
  }, [amountOutEst, slippagePercent]);

  const onSwap = async () => {
    if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
      toast.error('Connect with Boing Express on Boing testnet (6913).');
      return;
    }
    if (!pool) {
      toast.error('Pool address not configured.');
      return;
    }
    if (amountInBn == null || minOutBn == null) {
      toast.error('Enter a valid integer amount in.');
      return;
    }
    const p = pickExpressProvider(getWalletProvider);
    if (!p) {
      toast.error('Boing Express provider not found.');
      return;
    }

    const dirWord = direction === 'a_to_b' ? 0n : 1n;
    const calldata = encodeNativeAmmSwapCalldataHex(dirWord, amountInBn, minOutBn);

    if (
      !window.confirm(
        `Submit native pool swap?\nAmount in: ${amountInBn.toString()}\nMin out: ${minOutBn.toString()}\nCalldata length: ${(calldata.length - 2) / 2} bytes`
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const hash = await boingExpressSendTransaction(p, {
        type: 'contract_call',
        contract: pool,
        calldata,
      });
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      await loadReserves();
      setAmountIn('');
    } catch (e) {
      toast.error(e?.message || 'boing_sendTransaction failed');
    } finally {
      setBusy(false);
    }
  };

  if (!pool) return null;

  return (
    <section
      className="mb-6 rounded-xl border p-5 text-left"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(59, 130, 246, 0.45)',
      }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Native constant-product pool (Boing VM)
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Configured via <code className="text-xs">REACT_APP_BOING_NATIVE_AMM_POOL</code> (32-byte pool id). Integer
        ledger units only (≤ u64 for correct VM math). Requires{' '}
        <strong>Boing Express</strong> —{' '}
        <Link to="/boing/native-vm" className="text-blue-400 underline text-sm">
          Native VM tools
        </Link>
        .
      </p>

      <div className="flex flex-wrap gap-2 mb-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span>
          Reserve A:{' '}
          <strong className="text-[var(--text-primary)]">{reserveA != null ? reserveA.toString() : '—'}</strong>
        </span>
        <span>
          Reserve B:{' '}
          <strong className="text-[var(--text-primary)]">{reserveB != null ? reserveB.toString() : '—'}</strong>
        </span>
        <button
          type="button"
          onClick={() => loadReserves()}
          className="ml-auto text-blue-400 underline"
        >
          Refresh reserves
        </button>
      </div>
      {loadError && (
        <p className="text-xs text-amber-400 mb-2">{loadError}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Direction
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full text-sm p-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="a_to_b">A → B (sell A for B)</option>
            <option value="b_to_a">B → A (sell B for A)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Amount in (integer units)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 1000"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {amountOutEst != null && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Est. out: <strong>{amountOutEst.toString()}</strong> · Min out ({slippagePercent}% slip):{' '}
          <strong>{minOutBn != null ? minOutBn.toString() : '—'}</strong>
        </p>
      )}

      <button
        type="button"
        onClick={onSwap}
        disabled={
          busy ||
          chainId !== BOING_NATIVE_L1_CHAIN_ID ||
          walletType !== 'boingExpress' ||
          !isConnected ||
          amountInBn == null
        }
        className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: '#2563eb' }}
      >
        {busy ? 'Signing…' : 'Swap via Boing Express'}
      </button>
      {(chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Switch to Boing testnet and connect Boing Express to enable this button.
        </p>
      )}
    </section>
  );
}
