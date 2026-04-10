import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  buildNativeDexLedgerRouterV2ContractCallTx,
  buildNativeDexLedgerRouterV3ContractCallTx,
  encodeNativeAmmRemoveLiquidityToCalldata,
  encodeNativeAmmSwapToCalldata,
} from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { normalizeBoingFaucetAccountHex } from '../services/boingTestnetRpc';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { BOING_NETWORK_NATIVE_DEX_LEDGER_ROUTER_URL } from '../config/boingNetworkDocsUrls';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

function isValidAccountHex32(v) {
  return typeof v === 'string' && /^0x[0-9a-fA-F]{64}$/.test(v.trim());
}

function normalizeHex32Input(raw) {
  const t = (raw || '').trim();
  if (!t) return '';
  const with0x = t.startsWith('0x') ? t : `0x${t}`;
  if (!/^0x[0-9a-fA-F]{64}$/i.test(with0x)) return with0x;
  return `0x${with0x.slice(2).toLowerCase()}`;
}

function parseNonNegativeBigInt(raw) {
  try {
    const t = (raw || '').trim();
    if (!t) return null;
    const n = BigInt(t);
    return n >= 0n ? n : null;
  } catch {
    return null;
  }
}

/**
 * Forwarder-router contract_call builders for v5 pools: **`swap_to`** (160-byte inner) and **`remove_liquidity_to`** (192-byte inner).
 * Shown only under Native VM → Advanced; see network docs for layout.
 */
export default function NativeDexLedgerForwardPanel() {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const {
    effectivePoolHex,
    effectiveLedgerRouterV2Hex,
    effectiveLedgerRouterV3Hex,
  } = useBoingNativeDexIntegration();

  const [mode, setMode] = useState('swap_to');
  const [poolHex, setPoolHex] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = normalizeHex32Input(effectivePoolHex || '');
    if (!isValidAccountHex32(p)) return;
    setPoolHex((prev) => {
      const t = (prev || '').trim();
      if (t === '' || !isValidAccountHex32(prev)) return p;
      return prev;
    });
  }, [effectivePoolHex]);

  const [direction, setDirection] = useState('a_to_b');
  const [amountInStr, setAmountInStr] = useState('');
  const [minOutStr, setMinOutStr] = useState('0');
  const [recipientStr, setRecipientStr] = useState('');

  const [liqBurnStr, setLiqBurnStr] = useState('');
  const [minAStr, setMinAStr] = useState('0');
  const [minBStr, setMinBStr] = useState('0');
  const [recipAStr, setRecipAStr] = useState('');
  const [recipBStr, setRecipBStr] = useState('');

  const senderHex = useMemo(() => normalizeBoingFaucetAccountHex(account), [account]);

  const routerV2 = (effectiveLedgerRouterV2Hex || '').trim();
  const routerV3 = (effectiveLedgerRouterV3Hex || '').trim();

  const canBase = useMemo(
    () =>
      chainId === BOING_NATIVE_L1_CHAIN_ID &&
      walletType === 'boingExpress' &&
      isConnected &&
      senderHex &&
      isValidAccountHex32(poolHex),
    [chainId, walletType, isConnected, senderHex, poolHex]
  );

  const canV2 = canBase && isValidAccountHex32(routerV2);
  const canV3 = canBase && isValidAccountHex32(routerV3);

  const runTx = useCallback(
    async (txObject) => {
      const p = pickExpressProvider(getWalletProvider);
      if (!p) {
        toast.error('Boing Express provider not found.');
        return;
      }
      setBusy(true);
      try {
        const hash = await boingExpressContractCallSignSimulateSubmit(p, txObject);
        toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      } catch (e) {
        toast.error(formatBoingExpressRpcError(e));
      } finally {
        setBusy(false);
      }
    },
    [getWalletProvider]
  );

  const onSubmitV2 = async () => {
    if (!canV2) {
      toast.error('Set pool, v2 forwarder router, and recipient (0x + 64 hex). Connect Boing Express on 6913.');
      return;
    }
    const amountIn = parseNonNegativeBigInt(amountInStr);
    const minOut = parseNonNegativeBigInt(minOutStr);
    if (amountIn == null || amountIn <= 0n) {
      toast.error('amount_in must be a positive integer.');
      return;
    }
    if (minOut == null) {
      toast.error('min_out must be a non-negative integer.');
      return;
    }
    const recip = normalizeHex32Input(recipientStr);
    if (!isValidAccountHex32(recip)) {
      toast.error('Recipient must be 0x + 64 hex (swap_to output account).');
      return;
    }
    const dir = direction === 'a_to_b' ? 0n : 1n;
    const inner = encodeNativeAmmSwapToCalldata(dir, amountIn, minOut, recip);
    const tx = buildNativeDexLedgerRouterV2ContractCallTx(senderHex, routerV2, poolHex, inner);
    await runTx(tx);
  };

  const onSubmitV3 = async () => {
    if (!canV3) {
      toast.error('Set pool, v3 forwarder router, and recipients. Connect Boing Express on 6913.');
      return;
    }
    const burn = parseNonNegativeBigInt(liqBurnStr);
    const minA = parseNonNegativeBigInt(minAStr);
    const minB = parseNonNegativeBigInt(minBStr);
    if (burn == null || burn <= 0n) {
      toast.error('liquidity_burn must be a positive integer.');
      return;
    }
    if (minA == null || minB == null) {
      toast.error('min_a / min_b must be non-negative integers.');
      return;
    }
    const ra = normalizeHex32Input(recipAStr);
    const rb = normalizeHex32Input(recipBStr);
    if (!isValidAccountHex32(ra) || !isValidAccountHex32(rb)) {
      toast.error('recipient_a and recipient_b must be 0x + 64 hex.');
      return;
    }
    const inner = encodeNativeAmmRemoveLiquidityToCalldata(burn, minA, minB, ra, rb);
    const tx = buildNativeDexLedgerRouterV3ContractCallTx(senderHex, routerV3, poolHex, inner);
    await runTx(tx);
  };

  return (
    <section
      className="rounded-xl border p-5 text-left mb-0"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(34, 197, 94, 0.35)',
      }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        V5 pool forwards (router v2 / v3)
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Build <code className="text-xs">contract_call</code> txs that forward <strong>v5</strong> pool calldata:{' '}
        <code className="text-xs">swap_to</code> (160-byte inner → forwarder <strong>v2</strong>) and{' '}
        <code className="text-xs">remove_liquidity_to</code> (192-byte inner → forwarder <strong>v3</strong>). Router ids
        resolve from network defaults or build env.{' '}
        <a
          href={BOING_NETWORK_NATIVE_DEX_LEDGER_ROUTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline text-xs"
        >
          Boing docs — forwarder routers
        </a>
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('swap_to')}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'swap_to' ? 'bg-emerald-600 text-white' : 'border border-emerald-500/40 text-emerald-200'}`}
        >
          swap_to (v2)
        </button>
        <button
          type="button"
          onClick={() => setMode('remove_liquidity_to')}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'remove_liquidity_to' ? 'bg-emerald-600 text-white' : 'border border-emerald-500/40 text-emerald-200'}`}
        >
          remove_liquidity_to (v3)
        </button>
      </div>

      <div className="grid gap-2 mb-4">
        <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Pool (CP AMM)
        </label>
        <input
          type="text"
          value={poolHex}
          onChange={(e) => setPoolHex(e.target.value)}
          className="w-full text-xs font-mono p-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          spellCheck={false}
        />
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Forwarder v2: {routerV2 || '(unset)'} · forwarder v3: {routerV3 || '(unset)'}
        </p>
      </div>

      {mode === 'swap_to' ? (
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="text-sm p-2 rounded-lg border w-full sm:w-auto"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="a_to_b">A → B</option>
              <option value="b_to_a">B → A</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={amountInStr}
              onChange={(e) => setAmountInStr(e.target.value)}
              placeholder="amount_in (u128)"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={minOutStr}
              onChange={(e) => setMinOutStr(e.target.value)}
              placeholder="min_out"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <input
            type="text"
            value={recipientStr}
            onChange={(e) => setRecipientStr(e.target.value)}
            placeholder="Recipient 0x + 64 hex (token credit)"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            disabled={busy || !canV2}
            onClick={onSubmitV2}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
          >
            Sign &amp; submit forwarder v2
          </button>
        </div>
      ) : (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={liqBurnStr}
              onChange={(e) => setLiqBurnStr(e.target.value)}
              placeholder="liquidity_burn"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={minAStr}
              onChange={(e) => setMinAStr(e.target.value)}
              placeholder="min_a"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={minBStr}
              onChange={(e) => setMinBStr(e.target.value)}
              placeholder="min_b"
              className="text-sm p-2 rounded-lg border font-mono sm:col-span-2"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <input
            type="text"
            value={recipAStr}
            onChange={(e) => setRecipAStr(e.target.value)}
            placeholder="recipient_a 0x + 64 hex"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <input
            type="text"
            value={recipBStr}
            onChange={(e) => setRecipBStr(e.target.value)}
            placeholder="recipient_b 0x + 64 hex"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            disabled={busy || !canV3}
            onClick={onSubmitV3}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
          >
            Sign &amp; submit forwarder v3
          </button>
        </div>
      )}
    </section>
  );
}
