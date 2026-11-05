/**
 * Staking surface (Boing L1): network total stake (TVL) from boing_getNetworkInfo.chain_native,
 * plus wallet stake via boing_getAccount. Bond / Unbond / Claim unbond stay in Boing Express until
 * Finance wires those dApp tx types.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID, getNetworkByChainId } from '../config/networks';
import { fetchBoingNativeAccount, fetchBoingNetworkStakeStats } from '../services/boingNativeVm';
import { getBoingObserverAccountUrl } from '../config/boingExplorerUrls';
import { BOING_EXPRESS_ORIGIN } from '../config/networkExternalLinks';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { formatNativeLedger } from '../utils/boingNativeAmount';
import { useConnectBoingExpress } from './BoingOnlyGate';

function shortHex(hex) {
  if (!hex || typeof hex !== 'string') return '—';
  const h = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex;
  if (h.length <= 16) return `0x${h}`;
  return `0x${h.slice(0, 8)}…${h.slice(-6)}`;
}

export default function StakingBoingContent() {
  const { account, isConnected, chainId, walletType } = useWallet();
  const { connect: connectWallet } = useConnectBoingExpress();
  const [networkStats, setNetworkStats] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);

  const net = getNetworkByChainId(BOING_NATIVE_L1_CHAIN_ID);
  const onBoing = Number(chainId) === BOING_NATIVE_L1_CHAIN_ID;
  const accountOk = Boolean(account && isBoingNativeAccountIdHex(account));
  const showWallet = isConnected && accountOk && onBoing;

  const fetchNetwork = useCallback(async () => {
    setNetworkLoading(true);
    setNetworkError(null);
    try {
      const stats = await fetchBoingNetworkStakeStats();
      setNetworkStats(stats);
    } catch (err) {
      console.error('Boing staking network fetch error:', err);
      setNetworkError(err?.message || String(err));
      setNetworkStats(null);
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!showWallet) {
      setSnapshot(null);
      setWalletError(null);
      return;
    }
    setWalletLoading(true);
    setWalletError(null);
    try {
      const acc = await fetchBoingNativeAccount(account);
      setSnapshot({
        balance: acc?.balance != null ? String(acc.balance) : '0',
        stake: acc?.stake != null ? String(acc.stake) : '0',
        nonce: typeof acc?.nonce === 'number' ? acc.nonce : Number(acc?.nonce) || 0,
        pendingUnbond: acc?.pending_unbond != null ? String(acc.pending_unbond) : null,
        unbondUnlockHeight:
          acc?.unbond_unlock_height != null ? Number(acc.unbond_unlock_height) : null,
        decimals: typeof acc?.decimals === 'number' ? acc.decimals : 0,
      });
    } catch (err) {
      console.error('Boing staking wallet fetch error:', err);
      setWalletError(err?.message || String(err));
      setSnapshot(null);
    } finally {
      setWalletLoading(false);
    }
  }, [showWallet, account]);

  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const refreshAll = () => {
    fetchNetwork();
    fetchWallet();
  };

  const decimalsForNetwork = networkStats?.decimals ?? 0;
  const decimalsForWallet = snapshot?.decimals ?? decimalsForNetwork;
  const explorerUrl = accountOk ? getBoingObserverAccountUrl(account) : null;
  const expressStakeUrl = BOING_EXPRESS_ORIGIN;

  return (
    <>
      <Helmet>
        <title>Staking | Boing Finance</title>
        <meta
          name="description"
          content="Boing Network stake TVL and your bonded BOING. Stake and unbond in Boing Express."
        />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8" data-testid="staking-page">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Staking
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {net?.name || 'Boing Testnet'} · chain {BOING_NATIVE_L1_CHAIN_ID}
                {walletType === 'boingExpress' && showWallet ? ' · Boing Express' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={refreshAll}
              disabled={networkLoading || walletLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              {networkLoading || walletLoading ? 'Refreshing…' : 'Refresh'}
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
            <strong style={{ color: 'var(--text-primary)' }}>Protocol stake:</strong> network TVL is
            the sum of bonded stake from{' '}
            <code className="text-xs">boing_getNetworkInfo</code> →{' '}
            <code className="text-xs">chain_native.total_stake</code> (ledger units ÷ decimals). Bond,
            unbond, and claim run in{' '}
            <a
              href={expressStakeUrl}
              className="text-cyan-400 underline hover:text-cyan-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Boing Express
            </a>
            .
          </div>

          {/* Network TVL — always visible */}
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            data-testid="staking-network-tvl"
          >
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Network stake TVL
            </p>
            {networkError ? (
              <p className="text-sm text-red-300" role="alert">
                Could not load network stake: {networkError}
              </p>
            ) : networkLoading && !networkStats ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading network stake…</p>
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatNativeLedger(networkStats?.totalStake, decimalsForNetwork)}{' '}
                  <span className="text-lg font-medium">BOING</span>
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  Sum of account stakes at height{' '}
                  {networkStats?.asOfHeight != null
                    ? networkStats.asOfHeight.toLocaleString('en-US')
                    : '—'}
                  {networkStats?.accountCount != null
                    ? ` · ${networkStats.accountCount.toLocaleString('en-US')} accounts`
                    : ''}
                  {networkStats?.totalBalance != null
                    ? ` · spendable balances ${formatNativeLedger(networkStats.totalBalance, decimalsForNetwork)} BOING`
                    : ''}
                </p>
                {!networkStats?.stakingApyAvailable && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Staking APY is not published on public RPC yet.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Stake CTA */}
          <div
            className="rounded-xl border p-5 space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            data-testid="staking-cta"
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Stake BOING
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Bonding moves spendable BOING into protocol stake. Unbond queues a delay, then claim
              returns it to your balance. Finance shows TVL and your stake here; signing Bond /
              Unbond / Claim is in the wallet.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={expressStakeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium inline-flex items-center bg-cyan-600 text-white hover:bg-cyan-500"
                data-testid="staking-express-cta"
              >
                Stake in Boing Express
              </a>
              {!showWallet && (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
                  style={{
                    borderColor: 'rgba(59,130,246,0.45)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  Connect wallet to view your stake
                </button>
              )}
            </div>
          </div>

          {/* Wrong chain */}
          {isConnected && accountOk && !onBoing && (
            <div
              className="rounded-xl border p-6 text-center"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
            >
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Switch to Boing L1
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your account looks like a Boing AccountId, but the active chain is not{' '}
                {BOING_NATIVE_L1_CHAIN_ID}. Switch network in Boing Express, then refresh.
              </p>
            </div>
          )}

          {/* Wallet stake */}
          {showWallet && (
            <>
              <div
                className="rounded-xl border p-4"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Your account
                </p>
                <p className="font-mono text-sm break-all mb-2" style={{ color: 'var(--text-primary)' }}>
                  {account}
                </p>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 underline hover:text-cyan-300"
                  >
                    Open on boing.observer ({shortHex(account)})
                  </a>
                )}
              </div>

              {walletError && (
                <div
                  className="rounded-xl border px-4 py-3 text-sm text-red-300"
                  style={{ borderColor: 'rgba(248,113,113,0.4)' }}
                  role="alert"
                >
                  Could not load your stake: {walletError}
                </div>
              )}

              {walletLoading && !snapshot ? (
                <div
                  className="rounded-xl border p-6 text-center"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <p style={{ color: 'var(--text-secondary)' }}>Loading your stake…</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="staking-wallet-stats">
                  <div
                    className="rounded-xl border p-6"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Your stake
                    </h2>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {formatNativeLedger(snapshot?.stake, decimalsForWallet)}{' '}
                      <span className="text-base font-medium">BOING</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                      Nonce {snapshot?.nonce ?? '—'}
                      {snapshot?.pendingUnbond &&
                      /^\d+$/.test(snapshot.pendingUnbond) &&
                      BigInt(snapshot.pendingUnbond) > 0n
                        ? ` · pending unbond ${formatNativeLedger(snapshot.pendingUnbond, decimalsForWallet)}`
                        : ''}
                      {snapshot?.unbondUnlockHeight
                        ? ` · unlock height ${snapshot.unbondUnlockHeight.toLocaleString('en-US')}`
                        : ''}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border p-6"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Spendable balance
                    </h2>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {formatNativeLedger(snapshot?.balance, decimalsForWallet)}{' '}
                      <span className="text-base font-medium">BOING</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                      Available to bond in Express.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/portfolio"
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
              style={{
                borderColor: 'rgba(59,130,246,0.45)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              Portfolio
            </Link>
            <Link
              to="/swap"
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border inline-flex items-center"
              style={{
                borderColor: 'rgba(59,130,246,0.45)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              Swap
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
