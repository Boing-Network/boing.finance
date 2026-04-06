import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  buildLpShareTokenContractCallTx,
  buildNativeAmmLpVaultConfigureContractCallTx,
  buildNativeAmmLpVaultDepositAddContractCallTx,
  encodeLpShareTransferCalldataHex,
  encodeNativeAmmAddLiquidityCalldata,
  encodeNativeAmmLpVaultConfigureCalldataHex,
  encodeNativeAmmLpVaultDepositAddCalldataHex,
} from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { getContractAddress } from '../config/contracts';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { normalizeBoingFaucetAccountHex } from '../services/boingTestnetRpc';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import {
  BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL,
  BOING_NETWORK_NATIVE_AMM_LP_VAULT_URL,
  BOING_NETWORK_NATIVE_LP_SHARE_TOKEN_URL,
} from '../config/boingNetworkDocsUrls';

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

function parsePositiveBigInt(raw) {
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
 * Boing Express UI for native AMM LP vault (`configure`, `deposit_add`) and LP share token `transfer`.
 * Checklist A7.4 — prefills pool / vault / share from `contracts` + env (`REACT_APP_BOING_NATIVE_AMM_LP_*`).
 *
 * @param {{ compact?: boolean }} props
 */
export default function NativeAmmLpVaultPanel({ compact = false }) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { effectivePoolHex } = useBoingNativeDexIntegration();

  const defaultPool =
    effectivePoolHex || getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeConstantProductPool') || '';
  const defaultVault = getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeAmmLpVault') || '';
  const defaultShare = getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeAmmLpShareToken') || '';

  const [poolHex, setPoolHex] = useState(() => normalizeHex32Input(defaultPool));
  const [vaultHex, setVaultHex] = useState(() => normalizeHex32Input(defaultVault));
  const [shareHex, setShareHex] = useState(() => normalizeHex32Input(defaultShare));

  const [depAmountA, setDepAmountA] = useState('');
  const [depAmountB, setDepAmountB] = useState('');
  const [depMinLiq, setDepMinLiq] = useState('0');
  const [depVaultMinLp, setDepVaultMinLp] = useState('0');

  const [xferTo, setXferTo] = useState('');
  const [xferAmount, setXferAmount] = useState('1');

  const [busy, setBusy] = useState(false);

  const senderHex = useMemo(() => normalizeBoingFaucetAccountHex(account), [account]);

  const canSubmit = useMemo(() => {
    return (
      chainId === BOING_NATIVE_L1_CHAIN_ID &&
      walletType === 'boingExpress' &&
      isConnected &&
      senderHex &&
      isValidAccountHex32(poolHex) &&
      isValidAccountHex32(vaultHex) &&
      isValidAccountHex32(shareHex)
    );
  }, [chainId, walletType, isConnected, senderHex, poolHex, vaultHex, shareHex]);

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

  const onConfigure = async () => {
    if (!canSubmit) {
      toast.error('Connect Boing Express on 6913 and enter valid 32-byte vault, pool, and share accounts.');
      return;
    }
    const calldataHex = encodeNativeAmmLpVaultConfigureCalldataHex(poolHex, shareHex);
    const tx = buildNativeAmmLpVaultConfigureContractCallTx(senderHex, vaultHex, calldataHex);
    await runTx(tx);
  };

  const onDepositAdd = async () => {
    if (!canSubmit) {
      toast.error('Connect Boing Express on 6913 and enter valid vault, pool, and share accounts.');
      return;
    }
    const a = parsePositiveBigInt(depAmountA);
    const b = parsePositiveBigInt(depAmountB);
    if (a == null || b == null || a <= 0n || b <= 0n) {
      toast.error('Enter positive integer amounts for reserve A and B.');
      return;
    }
    const minLiq = parsePositiveBigInt(depMinLiq);
    const vminLp = parsePositiveBigInt(depVaultMinLp);
    if (minLiq == null || vminLp == null) {
      toast.error('Min liquidity / min LP must be non-negative integers.');
      return;
    }
    const inner = encodeNativeAmmAddLiquidityCalldata(a, b, minLiq);
    const calldataHex = encodeNativeAmmLpVaultDepositAddCalldataHex(inner, vminLp);
    const tx = buildNativeAmmLpVaultDepositAddContractCallTx(senderHex, vaultHex, poolHex, shareHex, calldataHex);
    await runTx(tx);
  };

  const onShareTransfer = async () => {
    if (!canSubmit) {
      toast.error('Connect Boing Express on 6913 and enter valid accounts.');
      return;
    }
    const to = normalizeHex32Input(xferTo);
    if (!isValidAccountHex32(to)) {
      toast.error('Recipient must be 0x + 64 hex (32-byte account).');
      return;
    }
    const amt = parsePositiveBigInt(xferAmount);
    if (amt == null || amt <= 0n) {
      toast.error('Enter a positive integer share amount.');
      return;
    }
    const calldataHex = encodeLpShareTransferCalldataHex(to, amt);
    const tx = buildLpShareTokenContractCallTx(senderHex, shareHex, calldataHex);
    await runTx(tx);
  };

  const hint = compact ? null : (
    <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
      Matches <code className="text-[10px]">boing-sdk</code> tutorial §7f–§7i —{' '}
      <a href={BOING_NETWORK_NATIVE_AMM_LP_VAULT_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
        LP vault
      </a>
      ,{' '}
      <a href={BOING_NETWORK_NATIVE_LP_SHARE_TOKEN_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
        share token
      </a>
      ; ecosystem backlog:{' '}
      <a href={BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
        HANDOFF-DEPENDENT-PROJECTS.md
      </a>
      . Set <code className="text-[10px]">REACT_APP_BOING_NATIVE_AMM_LP_VAULT</code> and{' '}
      <code className="text-[10px]">REACT_APP_BOING_NATIVE_AMM_LP_SHARE_TOKEN</code> at build time to prefill.
    </p>
  );

  return (
    <section
      className={`rounded-xl border p-5 text-left ${compact ? 'mt-4' : 'mb-6'}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(91, 33, 182, 0.35)',
      }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Native LP vault &amp; share token
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        <strong>Vault</strong> <code className="text-xs">configure</code> wires pool + share token;{' '}
        <code className="text-xs">deposit_add</code> wraps native <code className="text-xs">add_liquidity</code> and
        mints vault shares. <strong>Share transfer</strong> moves LP share balances on the share-token contract (same
        access list as CLI §7h).
      </p>
      {hint}

      <div className="grid gap-3 sm:grid-cols-1 mb-4">
        <label className="block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Vault account (0x + 64 hex)
        </label>
        <input
          type="text"
          value={vaultHex}
          onChange={(e) => setVaultHex(e.target.value)}
          className="w-full text-xs font-mono p-2 rounded-lg border mb-2"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="0x…"
          spellCheck={false}
        />
        <label className="block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Pool account (CP AMM)
        </label>
        <input
          type="text"
          value={poolHex}
          onChange={(e) => setPoolHex(e.target.value)}
          className="w-full text-xs font-mono p-2 rounded-lg border mb-2"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="0x…"
          spellCheck={false}
        />
        <label className="block text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          LP share token account
        </label>
        <input
          type="text"
          value={shareHex}
          onChange={(e) => setShareHex(e.target.value)}
          className="w-full text-xs font-mono p-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          placeholder="0x…"
          spellCheck={false}
        />
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            1. Configure vault
          </h3>
          <button
            type="button"
            disabled={busy || !canSubmit}
            onClick={onConfigure}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white"
          >
            Sign &amp; submit configure
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            2. Deposit add (vault → pool add_liquidity)
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 mb-2">
            <input
              type="text"
              value={depAmountA}
              onChange={(e) => setDepAmountA(e.target.value)}
              placeholder="Amount A (u128)"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={depAmountB}
              onChange={(e) => setDepAmountB(e.target.value)}
              placeholder="Amount B (u128)"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={depMinLiq}
              onChange={(e) => setDepMinLiq(e.target.value)}
              placeholder="Inner min_liquidity (default 0)"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={depVaultMinLp}
              onChange={(e) => setDepVaultMinLp(e.target.value)}
              placeholder="Vault min_lp (default 0)"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            type="button"
            disabled={busy || !canSubmit}
            onClick={onDepositAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
          >
            Sign &amp; submit deposit_add
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            3. Transfer LP shares
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 mb-2">
            <input
              type="text"
              value={xferTo}
              onChange={(e) => setXferTo(e.target.value)}
              placeholder="To (0x + 64 hex)"
              className="text-sm p-2 rounded-lg border font-mono sm:col-span-2"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <input
              type="text"
              value={xferAmount}
              onChange={(e) => setXferAmount(e.target.value)}
              placeholder="Amount"
              className="text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            type="button"
            disabled={busy || !canSubmit}
            onClick={onShareTransfer}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50"
          >
            Sign &amp; submit share transfer
          </button>
        </div>
      </div>

      {!compact && (
        <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
          More tools:{' '}
          <Link to="/liquidity" className="text-cyan-400 underline">
            Liquidity
          </Link>{' '}
          (direct pool add) ·{' '}
          <Link to="/swap" className="text-cyan-400 underline">
            Swap
          </Link>
        </p>
      )}
    </section>
  );
}
