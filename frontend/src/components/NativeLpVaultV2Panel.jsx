import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import {
  LP_VAULT_V2_HEX,
  executeLpVaultV2Steps,
  loadLpVaultV2,
  planLpVaultV2Deposit,
  planLpVaultV2Withdraw,
} from '../services/nativeLpVaultV2';
import { getWindowBoingProvider, boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const short = (h) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h || '—');
const label = (hex, tokens) => (tokens || []).find((t) => (t.id || '').toLowerCase() === (hex || '').toLowerCase())?.symbol?.trim() || short(hex);
const parseAmt = (s) => (/^\d+$/.test((s || '').trim()) && BigInt(s.trim()) > 0n ? BigInt(s.trim()) : null);

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

/** LP vault v2 for custody pools (USDC/BOING on testnet): deposit both tokens for shares, withdraw shares. */
export default function NativeLpVaultV2Panel({ slippagePercent = 0.5 }) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { indexerPickerTokens } = useBoingNativeDexIntegration();
  const client = useMemo(() => getSharedBoingClient(), []);
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);
  const [amountA, setAmountA] = useState('');
  const [shares, setShares] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const bps = BigInt(Math.max(0, Math.min(5000, Math.round(Number(slippagePercent) * 100) || 50)));

  const load = useCallback(async () => {
    setErr(null);
    try {
      setS(await loadLpVaultV2(client, account || null));
    } catch (e) {
      setErr(e?.message || 'Could not load the vault');
    }
  }, [client, account]);
  useEffect(() => {
    load();
  }, [load]);

  const dep = useMemo(() => {
    const a = parseAmt(amountA);
    if (!s || !a) return null;
    try {
      return planLpVaultV2Deposit(s, account || s.vaultHex, a, bps);
    } catch (e) {
      return { error: e.message };
    }
  }, [s, amountA, account, bps]);
  const wd = useMemo(() => {
    const n = parseAmt(shares);
    if (!s || !n) return null;
    try {
      return planLpVaultV2Withdraw(s, account || s.vaultHex, n, bps);
    } catch (e) {
      return { error: e.message };
    }
  }, [s, shares, account, bps]);

  const run = async (plan, what) => {
    if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
      toast.error('Connect with Boing Express on Boing testnet (6913).');
      return;
    }
    const provider = pickExpressProvider(getWalletProvider);
    if (!provider) {
      toast.error(boingWalletMissingMessage());
      return;
    }
    setBusy(true);
    try {
      await executeLpVaultV2Steps(
        plan,
        (tx, o) => boingExpressContractCallSignSimulateSubmit(provider, tx, { senderHex: account, waitForInclusion: o?.waitForInclusion, returnSubmitMeta: true }),
        setStep,
      );
      toast.success(`${what} complete`);
      setAmountA('');
      setShares('');
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
      setStep('');
      load();
    }
  };

  const A = s ? label(s.vault.tokenAHex, indexerPickerTokens) : 'A';
  const B = s ? label(s.vault.tokenBHex, indexerPickerTokens) : 'B';
  const box = { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' };
  const btn = { background: 'var(--accent-primary, #6366f1)', color: '#fff' };
  return (
    <div className="rounded-lg border p-4 mb-4" style={box} data-testid="lp-vault-v2-panel">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>LP vault v2 (custody pools)</h3>
        <button type="button" className="text-xs underline" onClick={load} disabled={busy}>Refresh</button>
      </div>
      <p className="text-xs mb-3">
        Vault <code title={LP_VAULT_V2_HEX}>{short(LP_VAULT_V2_HEX)}</code>
        {s && <> on pool <code title={s.vault.poolHex}>{short(s.vault.poolHex)}</code> — reserves {String(s.pool.reserveA)} {A} : {String(s.pool.reserveB)} {B}, total shares {String(s.vault.totalShares)}</>}.
        Shares are 1:1 with pool LP held by the vault; withdrawals are paid by the pool straight to you.
      </p>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {s?.holder && (
        <p className="text-sm mb-3" data-testid="lp-vault-v2-holder">
          Your shares: <strong style={{ color: 'var(--text-primary)' }}>{String(s.holder.shares)}</strong> · {A} {String(s.holder.balA)} · {B} {String(s.holder.balB)}
        </p>
      )}
      {s && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs mb-1" htmlFor="v2-dep">Deposit {A} (whole units)</label>
            <input id="v2-dep" inputMode="numeric" className="w-full rounded border px-2 py-1 bg-transparent mb-2" value={amountA} disabled={busy} onChange={(e) => setAmountA(e.target.value)} placeholder="0" />
            {dep?.error && <p className="text-xs text-red-500">{dep.error}</p>}
            {dep && !dep.error && (
              <div className="text-xs mb-2" data-testid="lp-vault-v2-approvals">
                + {String(dep.amountB)} {B} (balanced at current reserves) → ~{String(dep.shares)} shares (min {String(dep.minShares)})
                <br />
                {A} allowance {String(s.holder?.allowA ?? 0n)}: {dep.needA ? 'approval needed (exact amount)' : 'sufficient'} · {B} allowance {String(s.holder?.allowB ?? 0n)}: {dep.needB ? 'approval needed (exact amount)' : 'sufficient'}
                <br />
                {dep.steps.length} signature{dep.steps.length > 1 ? 's' : ''}: {dep.steps.map((x) => x.label).join(' → ')}
              </div>
            )}
            <button type="button" className="w-full rounded py-2 font-semibold" style={btn} disabled={busy || !dep || dep.error || !account} onClick={() => run(dep, 'Deposit')}>
              {busy && step ? `Working: ${step}…` : 'Deposit'}
            </button>
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="v2-wd">Withdraw shares</label>
            <input id="v2-wd" inputMode="numeric" className="w-full rounded border px-2 py-1 bg-transparent mb-2" value={shares} disabled={busy} onChange={(e) => setShares(e.target.value)} placeholder="0" />
            {wd?.error && <p className="text-xs text-red-500">{wd.error}</p>}
            {wd && !wd.error && (
              <p className="text-xs mb-2">→ ~{String(wd.outA)} {A} + {String(wd.outB)} {B} (min {String(wd.minA)} / {String(wd.minB)})</p>
            )}
            <button type="button" className="w-full rounded py-2 font-semibold" style={btn} disabled={busy || !wd || wd.error || !account} onClick={() => run(wd, 'Withdraw')}>
              {busy && step ? `Working: ${step}…` : 'Withdraw'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}