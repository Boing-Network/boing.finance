import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS, formatSolanaRpcError } from '../config/solanaConfig';
import { parseSplAmount } from '../services/solanaCreatePool';
import {
  depositRaydiumCpmmLiquidity,
  fetchRaydiumCpmmPool,
  formatSplAmount,
  quoteCpmmTokenBForTokenA,
  withdrawRaydiumCpmmLiquidity,
} from '../services/solanaLiquidity';

const RAYDIUM_POOLS = 'https://raydium.io/liquidity-pools/?tab=standard';

function explorerAccount(network, address) {
  const cluster = network === 'mainnet' ? '' : `?cluster=devnet`;
  return `https://solscan.io/account/${address}${cluster}`;
}

function shortPk(pk) {
  if (!pk) return '—';
  const s = typeof pk === 'string' ? pk : pk.toBase58?.() || String(pk);
  if (s.length < 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function SolanaLiquidityPanel() {
  const { connected, connectWallet, network, connection, address, signTransaction } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;
  const [searchParams] = useSearchParams();
  const [poolId, setPoolId] = useState(() => searchParams.get('pool') || '');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [quoteLocked, setQuoteLocked] = useState(false);
  const [removePct, setRemovePct] = useState('25');
  const [pool, setPool] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadPool = async ({ silent = false } = {}) => {
    if (!poolId.trim()) {
      if (!silent) toast.error('Enter a Raydium CPMM pool id.');
      return;
    }
    try {
      const info = await fetchRaydiumCpmmPool({
        connection,
        poolId: poolId.trim(),
        ownerAddress: address,
        network,
      });
      setPool(info);
      if (!silent && info.userLp === 0n) toast('No LP in this pool for the connected wallet.');
    } catch (e) {
      setPool(null);
      if (!silent) toast.error(formatSolanaRpcError(e) || e?.message || 'Could not load that pool.');
    }
  };

  useEffect(() => {
    if (!connected || !connection || !poolId.trim()) return undefined;
    let cancelled = false;
    fetchRaydiumCpmmPool({
      connection,
      poolId: poolId.trim(),
      ownerAddress: address,
      network,
    })
      .then((info) => {
        if (!cancelled) setPool(info);
      })
      .catch(() => {
        if (!cancelled) setPool(null);
      });
    return () => {
      cancelled = true;
    };
  }, [connected, connection, poolId, address, network]);

  useEffect(() => {
    if (!pool || quoteLocked) return;
    try {
      const a = amountA.trim();
      if (!a) return;
      const aBn = parseSplAmount(a, pool.mintDecimalA);
      if (aBn <= 0n || pool.reserveA <= 0n) return;
      const b = quoteCpmmTokenBForTokenA(aBn, pool.reserveA, pool.reserveB);
      setAmountB(formatSplAmount(b, pool.mintDecimalB));
    } catch {
      /* ignore incomplete input */
    }
  }, [amountA, pool, quoteLocked]);

  const quotedBHint = useMemo(() => {
    if (!pool) return 'quoted from reserves after load';
    return `quoted vs ${shortPk(pool.mintB.toBase58())}`;
  }, [pool]);

  const onAdd = async () => {
    if (!connected || !address) {
      toast.error('Connect a Solana wallet first.');
      return;
    }
    setBusy(true);
    try {
      const result = await depositRaydiumCpmmLiquidity({
        connection,
        ownerAddress: address,
        signTransaction,
        poolId: poolId.trim(),
        amountA,
        amountB,
        network,
      });
      toast.success(`Liquidity added. ${result.signature.slice(0, 10)}…`);
      setAmountA('');
      setAmountB('');
      await loadPool({ silent: true });
    } catch (e) {
      toast.error(formatSolanaRpcError(e) || e?.message || 'Add liquidity failed.');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!pool || pool.userLp <= 0n) {
      toast.error('Load a pool where you hold LP first.');
      return;
    }
    const pct = Math.min(100, Math.max(1, Number(removePct) || 0));
    const lpAmount = (pool.userLp * BigInt(pct)) / 100n;
    if (lpAmount <= 0n) {
      toast.error('Nothing to remove.');
      return;
    }
    setBusy(true);
    try {
      const result = await withdrawRaydiumCpmmLiquidity({
        connection,
        ownerAddress: address,
        signTransaction,
        poolId: pool.poolId,
        lpAmount,
        network,
      });
      toast.success(`Removed ${pct}% LP. ${result.signature.slice(0, 10)}…`);
      await loadPool({ silent: true });
    } catch (e) {
      toast.error(formatSolanaRpcError(e) || e?.message || 'Remove liquidity failed.');
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = 'w-full text-sm p-2 rounded-lg border font-mono';
  const fieldStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <Helmet>
        <title>Liquidity - Solana | boing.finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
            Manage pool liquidity
          </h1>
          <p className="mb-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Add or remove on an existing Raydium CPMM pool. New pairs:{' '}
            <Link to="/create-pool" className="text-cyan-400 underline">
              Create Pool
            </Link>
            . Cluster: {solanaNetwork.name}.
          </p>

          {!connected ? (
            <div className="text-center">
              <button
                type="button"
                onClick={connectWallet}
                className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
                style={{ background: 'var(--accent-teal)' }}
              >
                Connect Solana Wallet
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl border p-5 space-y-4 text-left"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <label className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Raydium CPMM pool id
                <input
                  className={`${fieldClass} mt-1`}
                  style={fieldStyle}
                  value={poolId}
                  onChange={(e) => {
                    setPoolId(e.target.value.trim());
                    setPool(null);
                  }}
                  placeholder="Pool account address"
                  spellCheck={false}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Amount A
                  <input
                    className={`${fieldClass} mt-1`}
                    style={fieldStyle}
                    value={amountA}
                    onChange={(e) => {
                      setQuoteLocked(false);
                      setAmountA(e.target.value);
                    }}
                    placeholder="0.0"
                  />
                </label>
                <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Amount B
                  <input
                    className={`${fieldClass} mt-1`}
                    style={fieldStyle}
                    value={amountB}
                    onChange={(e) => {
                      setQuoteLocked(true);
                      setAmountB(e.target.value);
                    }}
                    placeholder={quotedBHint}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--finance-green-mid, #16a34a)' }}
                >
                  {busy ? 'Working…' : 'Add liquidity'}
                </button>
                <button
                  type="button"
                  onClick={() => loadPool()}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Load my LP
                </button>
              </div>

              {pool && (
                <div
                  className="rounded-lg border p-3 text-sm space-y-2"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <p>
                    Pool{' '}
                    <a
                      className="text-cyan-400 underline break-all"
                      href={explorerAccount(network, pool.poolId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pool.poolId}
                    </a>
                  </p>
                  <p>
                    Reserves: {formatSplAmount(pool.reserveA, pool.mintDecimalA)} /{' '}
                    {formatSplAmount(pool.reserveB, pool.mintDecimalB)}
                  </p>
                  <p>
                    Your LP: {formatSplAmount(pool.userLp, pool.lpDecimals)} · share{' '}
                    {(Number(pool.shareBps) / 100).toFixed(2)}%
                  </p>
                  <p>
                    Your share ≈ {formatSplAmount(pool.amountA, pool.mintDecimalA)} +{' '}
                    {formatSplAmount(pool.amountB, pool.mintDecimalB)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs">
                      Remove %
                      <input
                        className={`${fieldClass} mt-1 w-24`}
                        style={fieldStyle}
                        value={removePct}
                        onChange={(e) => setRemovePct(e.target.value.replace(/\D/g, ''))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={onRemove}
                      disabled={busy || pool.userLp <= 0n}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: '#b91c1c' }}
                    >
                      Remove LP
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Browse published pools on{' '}
                <a className="text-cyan-400 underline" href={RAYDIUM_POOLS} target="_blank" rel="noopener noreferrer">
                  Raydium
                </a>
                . Confirmed deposits link out to Solscan from the success toast.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
