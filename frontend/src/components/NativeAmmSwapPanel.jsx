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
  encodeNativeAmmAddLiquidityCalldataHex,
  constantProductAmountOut,
  parseNativeAmmReserveU128,
} from '../services/nativeAmmCalldata';
import { nativeConstantProductPoolAccessListJson } from '../services/nativeAmmAccessList';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
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

/**
 * In-app swap against the configured native CP pool (`contracts` nativeConstantProductPool: env override or canonical testnet id).
 * Requires Boing Express on chain 6913. Reserves are ledger units (u64-safe); no ERC-20 legs.
 */
export default function NativeAmmSwapPanel({ slippagePercent = 0.5 }) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const pool = getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeConstantProductPool');

  const [reserveA, setReserveA] = useState(null);
  const [reserveB, setReserveB] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [direction, setDirection] = useState('a_to_b');
  const [amountIn, setAmountIn] = useState('');
  const [addAmountA, setAddAmountA] = useState('');
  const [addAmountB, setAddAmountB] = useState('');
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

  const addAmountABn = useMemo(() => parsePositiveBigInt(addAmountA), [addAmountA]);
  const addAmountBBn = useMemo(() => parsePositiveBigInt(addAmountB), [addAmountB]);

  const expressTxBase = useCallback(() => {
    const accessList = nativeConstantProductPoolAccessListJson(account, pool);
    return accessList ? { access_list: accessList } : {};
  }, [account, pool]);

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

    setBusy(true);
    try {
      const hash = await boingExpressContractCallSignSimulateSubmit(p, {
        type: 'contract_call',
        contract: pool,
        calldata,
        ...expressTxBase(),
      });
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      await loadReserves();
      setAmountIn('');
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
    }
  };

  const onAddLiquidity = async () => {
    if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
      toast.error('Connect with Boing Express on Boing testnet (6913).');
      return;
    }
    if (!pool) {
      toast.error('Pool address not configured.');
      return;
    }
    if (addAmountABn == null || addAmountBBn == null) {
      toast.error('Enter positive integer amounts for both reserves.');
      return;
    }
    const p = pickExpressProvider(getWalletProvider);
    if (!p) {
      toast.error('Boing Express provider not found.');
      return;
    }

    const calldata = encodeNativeAmmAddLiquidityCalldataHex(addAmountABn, addAmountBBn, 0n);

    setBusy(true);
    try {
      const hash = await boingExpressContractCallSignSimulateSubmit(p, {
        type: 'contract_call',
        contract: pool,
        calldata,
        ...expressTxBase(),
      });
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      await loadReserves();
      setAddAmountA('');
      setAddAmountB('');
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!pool) return null;

  return (
    <section
      data-testid="native-amm-panel"
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
        Trade against the public native constant-product pool for this deployment. Use <strong>whole-number</strong> ledger
        units only (≤ u64 for correct VM math). After you click swap, <strong>Boing Express</strong> will ask you to sign;
        the node may request a <strong>second signature</strong> if it widens the access list. Pool bytecode is{' '}
        <strong>immutable</strong> in this MVP. More flows:{' '}
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
          data-testid="native-amm-refresh-reserves"
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
            data-testid="native-amm-amount-in"
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
        data-testid="native-amm-swap-submit"
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

      <details className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
        <summary
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
        >
          Add liquidity (reserve A + B)
        </summary>
        <p className="text-xs mt-2 mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Increments on-chain ledger reserves (selector <code className="text-[10px]">0x11</code>). No LP
          shares in this MVP pool.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Add reserve A (integer)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={addAmountA}
              onChange={(e) => setAddAmountA(e.target.value.replace(/\D/g, ''))}
              className="w-full text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Add reserve B (integer)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={addAmountB}
              onChange={(e) => setAddAmountB(e.target.value.replace(/\D/g, ''))}
              className="w-full text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onAddLiquidity}
          disabled={
            busy ||
            chainId !== BOING_NATIVE_L1_CHAIN_ID ||
            walletType !== 'boingExpress' ||
            !isConnected ||
            addAmountABn == null ||
            addAmountBBn == null
          }
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: '#059669' }}
        >
          {busy ? 'Signing…' : 'Add liquidity via Boing Express'}
        </button>
      </details>

      {(chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Switch to Boing testnet and connect Boing Express to enable this button.
        </p>
      )}
    </section>
  );
}
