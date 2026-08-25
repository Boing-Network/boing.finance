import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import {
  addLiquidityViaRouter,
  readUserLpPosition,
  removeLiquidityViaRouter,
} from '../services/evmAmmPairActions';

function isAddr(v) {
  try {
    return Boolean(v && ethers.isAddress(v) && v !== ethers.ZeroAddress);
  } catch {
    return false;
  }
}

/**
 * On-chain add / remove for an existing EVM pair. Fees are realized on remove.
 */
export default function EvmLiquidityManagePanel() {
  const { chainId, account, provider, signer, isConnected } = useWallet();
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePct, setRemovePct] = useState('25');
  const [position, setPosition] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadPosition = async () => {
    if (!isAddr(tokenA) || !isAddr(tokenB) || !account) {
      toast.error('Enter both token addresses and connect a wallet.');
      return;
    }
    try {
      if (!provider) throw new Error('Wallet provider not ready.');
      const pos = await readUserLpPosition({
        chainId,
        provider,
        account,
        tokenA: ethers.getAddress(tokenA),
        tokenB: ethers.getAddress(tokenB),
      });
      setPosition(pos);
      if (pos.lp === 0n) toast('No LP in this pair for the connected wallet.');
    } catch (e) {
      setPosition(null);
      toast.error(e?.message || 'Could not read pair.');
    }
  };

  const onAdd = async () => {
    if (!isConnected) return toast.error('Connect your wallet.');
    if (!isAddr(tokenA) || !isAddr(tokenB)) return toast.error('Enter valid token addresses.');
    let a;
    let b;
    try {
      a = ethers.parseUnits(amountA || '0', 18);
      b = ethers.parseUnits(amountB || '0', 18);
    } catch {
      toast.error('Enter valid amounts.');
      return;
    }
    if (a <= 0n || b <= 0n) return toast.error('Amounts must be greater than zero.');
    setBusy(true);
    try {
      if (!signer) throw new Error('Connect an EVM wallet first.');
      const minA = (a * 95n) / 100n;
      const minB = (b * 95n) / 100n;
      const result = await addLiquidityViaRouter({
        chainId,
        signer,
        tokenA: ethers.getAddress(tokenA),
        tokenB: ethers.getAddress(tokenB),
        amountADesired: a,
        amountBDesired: b,
        amountAMin: minA,
        amountBMin: minB,
      });
      toast.success(`Liquidity added. ${result.hash.slice(0, 10)}…`);
      setAmountA('');
      setAmountB('');
      await loadPosition();
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || 'Add liquidity failed.');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!position || position.lp <= 0n) return toast.error('Load a position with LP first.');
    const pct = Math.min(100, Math.max(1, Number(removePct) || 0));
    const liquidity = (position.lp * BigInt(pct)) / 100n;
    if (liquidity <= 0n) return toast.error('Nothing to remove.');
    setBusy(true);
    try {
      if (!signer) throw new Error('Connect an EVM wallet first.');
      const result = await removeLiquidityViaRouter({
        chainId,
        signer,
        tokenA: position.tokenA,
        tokenB: position.tokenB,
        liquidity,
        amountAMin: 0n,
        amountBMin: 0n,
      });
      toast.success(`Removed ${pct}% LP. ${result.hash.slice(0, 10)}…`);
      await loadPosition();
    } catch (e) {
      toast.error(e?.shortMessage || e?.message || 'Remove liquidity failed.');
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
    <section
      className="rounded-xl border p-5 text-left mb-6"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Manage an existing pair
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Fees stay in the pool and are realized when you remove LP — there is no separate Collect.
        New pairs must be created in one transaction on{' '}
        <Link to="/create-pool" className="text-cyan-400 underline">
          Create Pool
        </Link>
        .
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Token A
          <input
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={tokenA}
            onChange={(e) => setTokenA(e.target.value.trim())}
            placeholder="0x…"
            spellCheck={false}
          />
        </label>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Token B
          <input
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={tokenB}
            onChange={(e) => setTokenB(e.target.value.trim())}
            placeholder="0x…"
            spellCheck={false}
          />
        </label>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Amount A
          <input
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.0"
          />
        </label>
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Amount B
          <input
            className={`${fieldClass} mt-1`}
            style={fieldStyle}
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.0"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !isConnected}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--finance-green-mid, #16a34a)' }}
        >
          {busy ? 'Working…' : 'Add liquidity'}
        </button>
        <button
          type="button"
          onClick={loadPosition}
          disabled={busy || !isConnected}
          className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          Load my LP
        </button>
      </div>

      {position && (
        <div
          className="rounded-lg border p-3 text-sm space-y-2"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <p>
            Pair <code className="text-xs break-all">{position.pair}</code>
          </p>
          <p>
            Your LP: {position.lp.toString()} · share {(Number(position.shareBps) / 100).toFixed(2)}% ·{' '}
            {position.symbol0}/{position.symbol1}
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
              disabled={busy || position.lp <= 0n}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#b91c1c' }}
            >
              Remove LP
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
