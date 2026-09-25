/**
 * Portfolio Boing L1 - native BOING balance + account snapshot via Boing RPC / Express.
 * Shown when the connected wallet is on chain 6913 (Boing VM, not EVM/ethers).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID, getNetworkByChainId } from '../config/networks';
import { fetchBoingNativeAccount } from '../services/boingNativeVm';
import { getBoingObserverAccountUrl, BOING_OBSERVER_BASE_URL } from '../config/boingExplorerUrls';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';

function formatBoingAmount(raw) {
  if (raw == null) return '—';
  const s = String(raw);
  if (!/^\d+$/.test(s)) return s;
  if (s === '0') return '0';
  return s.replace(/^0+/, '') || '0';
}

function shortHex(hex) {
  if (!hex || typeof hex !== 'string') return '—';
  const h = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex;
  if (h.length <= 16) return `0x${h}`;
  return `0x${h.slice(0, 8)}…${h.slice(-6)}`;
}

export default function PortfolioBoingContent() {
  const { account, isConnected, connectWallet, chainId, walletType } = useWallet();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const net = getNetworkByChainId(BOING_NATIVE_L1_CHAIN_ID);
  const onBoing = Number(chainId) === BOING_NATIVE_L1_CHAIN_ID;
  const accountOk = Boolean(account && isBoingNativeAccountIdHex(account));

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !accountOk || !onBoing) return;
    setLoading(true);
    setError(null);
    try {
      const acc = await fetchBoingNativeAccount(account);
      setSnapshot({
        balance: acc?.balance != null ? String(acc.balance) : '0',
        stake: acc?.stake != null ? String(acc.stake) : '0',
        nonce: typeof acc?.nonce === 'number' ? acc.nonce : Number(acc?.nonce) || 0,
        pendingUnbond: acc?.pending_unbond != null ? String(acc.pending_unbond) : null,
        unbondUnlockHeight:
          acc?.unbond_unlock_height != null ? Number(acc.unbond_unlock_height) : null,
      });
    } catch (err) {
      console.error('Boing portfolio fetch error:', err);
      setError(err?.message || String(err));
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected, accountOk, onBoing, account]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  if (!isConnected || !accountOk) {
    return (
      <>
        <Helmet>
          <title>Portfolio - Boing L1 | Boing Finance</title>
        </Helmet>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Portfolio
            </h1>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Connect <strong style={{ color: 'var(--text-primary)' }}>Boing Express</strong> on Boing
              testnet (chain {BOING_NATIVE_L1_CHAIN_ID}) to view native BOING balance and stake. EVM
              wallets and ethers-style portfolio APIs do not apply on Boing L1.
            </p>
            <button
              type="button"
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect wallet
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!onBoing) {
    return (
      <>
        <Helmet>
          <title>Portfolio - Boing L1 | Boing Finance</title>
        </Helmet>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center rounded-xl border p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Switch to Boing L1
            </h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Your account looks like a Boing AccountId, but the active chain is not {BOING_NATIVE_L1_CHAIN_ID}.
              Switch network in Boing Express, then refresh.
            </p>
          </div>
        </div>
      </>
    );
  }

  const explorerUrl = getBoingObserverAccountUrl(account);

  return (
    <>
      <Helmet>
        <title>Portfolio - Boing L1 | Boing Finance</title>
        <meta
          name="description"
          content="View native BOING balance and stake on Boing L1 with Boing Express."
        />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Portfolio
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {net?.name || 'Boing Testnet'} · chain {BOING_NATIVE_L1_CHAIN_ID}
                {walletType === 'boingExpress' ? ' · Boing Express' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchBalances}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div
            className="rounded-xl border px-4 py-3 text-sm"
            role="status"
            style={{
              borderColor: 'rgba(45, 212, 191, 0.4)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Boing-native:</strong> balances come from{' '}
            <code className="text-xs">boing_getAccount</code> over the Boing RPC — not Alchemy/The Graph/EVM
            indexers. Fungible token and LP share positions live under{' '}
            <Link to="/swap?nativeTradeTab=liquidity" className="text-cyan-400 underline hover:text-cyan-300">
              Swap → Your liquidity
            </Link>
            {' '}and the{' '}
            <a href={BOING_OBSERVER_BASE_URL} className="text-cyan-400 underline hover:text-cyan-300" target="_blank" rel="noopener noreferrer">
              observer
            </a>
            .
          </div>

          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Account
            </p>
            <p className="font-mono text-sm break-all mb-2" style={{ color: 'var(--text-primary)' }}>
              {account}
            </p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 underline hover:text-cyan-300"
            >
              Open on boing.observer ({shortHex(account)})
            </a>
          </div>

          {error && (
            <div className="rounded-xl border px-4 py-3 text-sm text-red-300" style={{ borderColor: 'rgba(248,113,113,0.4)' }} role="alert">
              Could not load account: {error}
            </div>
          )}

          {loading && !snapshot ? (
            <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading balances…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  BOING balance
                </h2>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatBoingAmount(snapshot?.balance)} <span className="text-base font-medium">BOING</span>
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  Whole units (0 decimals on L1 wallet display).
                </p>
              </div>
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Staked
                </h2>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatBoingAmount(snapshot?.stake)} <span className="text-base font-medium">BOING</span>
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  Nonce {snapshot?.nonce ?? '—'}
                  {snapshot?.pendingUnbond && Number(snapshot.pendingUnbond) > 0
                    ? ` · pending unbond ${formatBoingAmount(snapshot.pendingUnbond)}`
                    : ''}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/swap#boing-native-trade"
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
              style={{ borderColor: 'rgba(59,130,246,0.45)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              Native trade hub
            </Link>
            <Link
              to="/create-pool"
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
              style={{ borderColor: 'rgba(59,130,246,0.45)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              Create pool
            </Link>
            <Link
              to="/deploy-token"
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
              style={{ borderColor: 'rgba(59,130,246,0.45)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              Deploy token
            </Link>
            <Link
              to="/boing/native-vm"
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
              style={{ borderColor: 'rgba(59,130,246,0.45)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              Native VM tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
