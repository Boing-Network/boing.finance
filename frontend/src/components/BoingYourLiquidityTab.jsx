import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBoingTokenBalance } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import { formatTokenAmount, isNativeBoingId, NATIVE_FEE_RESERVE, parseTokenAmount, sanitizeAmountInput, toAmountInput } from '../services/boingSwapQuote';
import { addLiquidityPreview, pairedAmount, removeLiquidityPreview, withSlippageFloor } from '../services/boingPoolsSimple';
import { executeAddLiquidity, executeRemoveLiquidity } from '../services/boingLiquidityTx';
import { getWindowBoingProvider, boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import BoingTokenPairIcons from './BoingTokenPairIcons';
import { PoolDetails, PRIMARY_BTN } from './BoingPoolsTab';

const panel = { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' };
const muted = { color: 'var(--text-tertiary)' };
const SLIPPAGE = 0.5;
const norm = (h) => String(h || '').toLowerCase();

function expressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

function useSigner() {
  const { account, getWalletProvider, walletType } = useWallet();
  return () => {
    if (walletType !== 'boingExpress') throw new Error('Liquidity on Boing is confirmed in Boing Express. Connect it from the header.');
    const provider = expressProvider(getWalletProvider);
    if (!provider) throw new Error(boingWalletMissingMessage());
    return (tx, o) =>
      boingExpressContractCallSignSimulateSubmit(provider, tx, { senderHex: account, waitForInclusion: o?.waitForInclusion, returnSubmitMeta: true });
  };
}

function AmountRow({ label, symbol, value, onChange, balance, testid, disabled, decimals = 0, native = false }) {
  const max = balance == null ? null : native ? (balance > NATIVE_FEE_RESERVE ? balance - NATIVE_FEE_RESERVE : 0n) : balance;
  return (
    <div className="rounded-xl border p-3" style={panel}>
      <div className="mb-1 flex justify-between text-xs" style={muted}>
        <span>{label}</span>
        {balance != null && (
          <button
            type="button"
            className="hover:underline"
            onClick={() => onChange(max > 0n ? toAmountInput(max, decimals) : '')}
            disabled={disabled}
            title={native ? 'Keeps 1 BOING for network fees' : undefined}
          >
            Balance: {formatTokenAmount(balance, decimals, 4)}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          inputMode={decimals ? 'decimal' : 'numeric'}
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value, decimals))}
          disabled={disabled}
          aria-label={`${symbol} amount`}
          data-testid={testid}
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{symbol}</span>
      </div>
    </div>
  );
}

function AddLiquidityPanel({ pools, initialCard, onDone, onCancel }) {
  const { account } = useWallet();
  const getSigner = useSigner();
  const { client, cards, tokens } = pools;
  const [tokA, setTokA] = useState(initialCard?.tokenA.id || tokens[0]?.id || '');
  const [tokB, setTokB] = useState(initialCard?.tokenB.id || tokens[1]?.id || '');
  const [amtA, setAmtA] = useState('');
  const [amtB, setAmtB] = useState('');
  const [balances, setBalances] = useState({});
  const [busy, setBusy] = useState(null);

  const card = useMemo(
    () =>
      cards.find(
        (c) =>
          (norm(c.tokenA.id) === norm(tokA) && norm(c.tokenB.id) === norm(tokB)) ||
          (norm(c.tokenA.id) === norm(tokB) && norm(c.tokenB.id) === norm(tokA))
      ) || null,
    [cards, tokA, tokB]
  );
  const flipped = card && norm(card.tokenA.id) !== norm(tokA);
  const tokOf = (id) => tokens.find((t) => norm(t.id) === norm(id)) || null;
  const symOf = (id) => tokOf(id)?.symbol || 'Token';
  const decOf = (id) => tokOf(id)?.decimals ?? 0;
  const [decA, decB] = [decOf(tokA), decOf(tokB)];

  useEffect(() => {
    if (!account) return;
    let off = false;
    const balanceOf = async (t) =>
      isNativeBoingId(t)
        ? BigInt((await client.getAccount(account))?.balance ?? 0) // native BOING: account balance (base units)
        : getBoingTokenBalance(client, t, account);
    Promise.all([tokA, tokB].filter(Boolean).map(async (t) => [norm(t), await balanceOf(t).catch(() => null)])).then(
      (rows) => !off && setBalances(Object.fromEntries(rows))
    );
    return () => {
      off = true;
    };
  }, [client, account, tokA, tokB]);

  // Auto-fill the other side at the pool ratio.
  const fill = (which, v) => {
    if (which === 'a') setAmtA(v);
    else setAmtB(v);
    const n = parseTokenAmount(v, which === 'a' ? decA : decB);
    if (!card || card.empty) return;
    const sideInPool = (which === 'a') !== Boolean(flipped) ? 'a' : 'b';
    const other = n ? pairedAmount(card, sideInPool, n) : null;
    if (which === 'a') setAmtB(other != null ? toAmountInput(other, decB) : '');
    else setAmtA(other != null ? toAmountInput(other, decA) : '');
  };

  const a = parseTokenAmount(amtA, decA);
  const b = parseTokenAmount(amtB, decB);
  const [poolA, poolB] = flipped ? [b, a] : [a, b];
  const preview = card && poolA && poolB ? addLiquidityPreview(card, poolA, poolB, card.lpBalance) : null;
  const balA = balances[norm(tokA)];
  const balB = balances[norm(tokB)];
  const insufficient = (a && balA != null && a > balA) || (b && balB != null && b > balB);

  let label = 'Add liquidity';
  let disabled = false;
  if (busy) [label, disabled] = [busy, true];
  else if (!card) [label, disabled] = ['No pool for this pair', true];
  else if (!a || !b) [label, disabled] = ['Enter amounts', true];
  else if (insufficient) [label, disabled] = ['Insufficient balance', true];
  else if (preview?.tooSmall) [label, disabled] = ['Amount too small for this pool', true];

  const submit = async () => {
    try {
      const sign = getSigner();
      setBusy('Preparing…');
      const minLp = withSlippageFloor(preview.minted, SLIPPAGE) || 1n;
      await executeAddLiquidity(client, {
        poolHex: card.poolHex,
        tokenAHex: card.tokenA.id,
        tokenBHex: card.tokenB.id,
        amountA: poolA,
        amountB: poolB,
        minLp,
        senderHex: account,
        signSimulateSubmit: sign,
        onState: (s) =>
          setBusy(
            s === 'add_native'
              ? `Confirm in Boing Express (wrap BOING → approve → add)…`
              : s === 'approve_a'
              ? `Approve ${card.tokenA.symbol} in Boing Express…`
              : s === 'approve_b'
                ? `Approve ${card.tokenB.symbol} in Boing Express…`
                : 'Confirm adding liquidity in Boing Express…'
          ),
      });
      toast.success(
        `Added ${formatTokenAmount(poolA, card.decimalsA ?? 0)} ${card.tokenA.symbol} + ${formatTokenAmount(poolB, card.decimalsB ?? 0)} ${card.tokenB.symbol}`
      );
      setAmtA('');
      setAmtB('');
      onDone();
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(null);
    }
  };

  const select = (value, set, testid) => (
    <select
      value={value}
      onChange={(e) => {
        set(e.target.value);
        setAmtA('');
        setAmtB('');
      }}
      className="rounded-lg border bg-transparent px-2 py-1 text-sm font-semibold"
      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
      aria-label="Token"
      data-testid={testid}
      disabled={Boolean(busy)}
    >
      {tokens.map((t) => (
        <option key={t.id} value={t.id}>
          {t.symbol}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-3 rounded-2xl border p-4" style={{ ...panel, backgroundColor: 'var(--bg-card)' }} data-testid="add-liquidity-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add liquidity</h3>
        <button type="button" className="text-sm" style={muted} onClick={onCancel}>Close</button>
      </div>
      <div className="flex items-center gap-2 text-sm" style={muted}>
        {select(tokA, setTokA, 'add-token-a')} <span>+</span> {select(tokB, setTokB, 'add-token-b')}
      </div>
      {!card ? (
        <div className="rounded-xl border p-3 text-sm" style={panel} data-testid="add-no-pool">
          No pool yet — <Link className="underline" to={`/create-pool?token=${encodeURIComponent(tokA)}`}>create one</Link>.
        </div>
      ) : (
        <>
          <AmountRow label="You deposit" symbol={symOf(tokA)} value={amtA} onChange={(v) => fill('a', v)} balance={balA} testid="add-amount-a" disabled={Boolean(busy)} decimals={decA} native={isNativeBoingId(tokA)} />
          <AmountRow label="And" symbol={symOf(tokB)} value={amtB} onChange={(v) => fill('b', v)} balance={balB} testid="add-amount-b" disabled={Boolean(busy)} decimals={decB} native={isNativeBoingId(tokB)} />
          <div className="rounded-xl border p-3 text-sm" style={panel} data-testid="add-preview">
            <div className="flex justify-between"><span style={muted}>Pool price</span><span>{card.priceLine}</span></div>
            <div className="flex justify-between">
              <span style={muted}>Your share after</span>
              <span className="font-medium" data-testid="add-share">{preview?.sharePct ?? '—'}</span>
            </div>
            <p className="mt-1 text-xs" style={muted}>The other amount fills in at the pool&apos;s current ratio. You can withdraw any time.</p>
            {card.native && (
              <p className="mt-1 text-xs" style={muted} data-testid="add-native-note">
                One confirmation: your BOING is wrapped, both tokens approved and the liquidity added in a single transaction.
              </p>
            )}
          </div>
        </>
      )}
      <button
        type="button"
        className="w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50"
        style={PRIMARY_BTN}
        disabled={disabled}
        onClick={submit}
        data-testid="add-submit"
      >
        {label}
      </button>
    </div>
  );
}

function RemoveLiquidityPanel({ pools, card, onDone, onCancel }) {
  const { account } = useWallet();
  const getSigner = useSigner();
  const [pct, setPct] = useState(50);
  const [busy, setBusy] = useState(null);
  const p = removeLiquidityPreview(card, pct);
  const submit = async () => {
    try {
      const sign = getSigner();
      setBusy('Confirm in Boing Express…');
      await executeRemoveLiquidity(pools.client, {
        poolHex: card.poolHex,
        tokenAHex: card.tokenA.id,
        tokenBHex: card.tokenB.id,
        burn: p.burn,
        minA: withSlippageFloor(p.outA, SLIPPAGE),
        minB: withSlippageFloor(p.outB, SLIPPAGE),
        senderHex: account,
        signSimulateSubmit: sign,
      });
      toast.success(
        `Withdrew ${formatTokenAmount(p.outA, card.decimalsA ?? 0)} ${card.tokenA.symbol} + ${formatTokenAmount(p.outB, card.decimalsB ?? 0)} ${card.tokenB.symbol}`
      );
      onDone();
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-3 rounded-2xl border p-4" style={{ ...panel, backgroundColor: 'var(--bg-card)' }} data-testid="remove-liquidity-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Remove liquidity · {card.pairLabel}</h3>
        <button type="button" className="text-sm" style={muted} onClick={onCancel}>Close</button>
      </div>
      <div className="text-4xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }} data-testid="remove-pct">{pct}%</div>
      <input type="range" min={1} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full" aria-label="Percent to remove" disabled={Boolean(busy)} />
      <div className="flex gap-2">
        {[25, 50, 75, 100].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setPct(v)}
            className="flex-1 rounded-lg border px-2 py-1 text-sm"
            style={{ borderColor: pct === v ? 'var(--finance-primary)' : 'var(--border-color)', color: 'var(--text-primary)' }}
            data-testid={`remove-preset-${v === 100 ? 'max' : v}`}
            disabled={Boolean(busy)}
          >
            {v === 100 ? 'Max' : `${v}%`}
          </button>
        ))}
      </div>
      <div className="rounded-xl border p-3 text-sm" style={panel} data-testid="remove-preview">
        <p style={muted}>You&apos;ll receive about</p>
        <p className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatTokenAmount(p.outA, card.decimalsA ?? 0)} {card.tokenA.symbol}</p>
        <p className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatTokenAmount(p.outB, card.decimalsB ?? 0)} {card.tokenB.symbol}</p>
        {card.native && <p className="mt-1 text-xs" style={muted}>BOING comes back as native BOING (unwrapped in the same transaction).</p>}
      </div>
      <button
        type="button"
        className="w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50"
        style={PRIMARY_BTN}
        disabled={Boolean(busy) || p.burn <= 0n}
        onClick={submit}
        data-testid="remove-submit"
      >
        {busy || (p.outA === 0n && p.outB === 0n ? 'Amount too small' : 'Remove liquidity')}
      </button>
    </div>
  );
}

/** Your liquidity: positions (share, what you'd get back) with Add / Remove, and the add form. */
export default function BoingYourLiquidityTab({ pools, addFor, onAddForConsumed }) {
  const { isConnected, account, chainId, connectWalletWithProvider } = useWallet();
  const connected = Boolean(isConnected && account);
  const [mode, setMode] = useState(/** @type {null | { kind: 'add' | 'remove', card?: any }} */ (null));

  useEffect(() => {
    if (addFor) {
      setMode({ kind: 'add', card: addFor });
      onAddForConsumed?.();
    }
  }, [addFor, onAddForConsumed]);

  const positions = pools.cards.filter((c) => c.lpBalance > 0n);
  const done = () => {
    setMode(null);
    pools.reload();
  };
  const connect = async () => {
    const provider = getWindowBoingProvider();
    if (!provider) return toast.error(boingWalletMissingMessage());
    try {
      await connectWalletWithProvider(provider, 'boingExpress', BOING_NATIVE_L1_CHAIN_ID);
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    }
  };

  return (
    <div className="space-y-4" data-testid="boing-your-liquidity-tab">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="liquidity-explainer">
        Earn a share of swap fees by adding tokens to a pool.
      </p>
      {!connected ? (
        <div className="rounded-2xl border p-8 text-center" style={panel} data-testid="liquidity-connect">
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Connect your wallet to see your liquidity</p>
          <button type="button" onClick={connect} className="mt-4 rounded-xl px-4 py-2 font-semibold text-white" style={PRIMARY_BTN}>
            Connect wallet
          </button>
        </div>
      ) : Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID ? (
        <div className="rounded-2xl border p-6 text-center text-sm" style={panel}>Switch your wallet to Boing testnet.</div>
      ) : (
        <>
          {mode?.kind === 'add' && <AddLiquidityPanel key={mode.card?.poolHex || 'new'} pools={pools} initialCard={mode.card} onDone={done} onCancel={() => setMode(null)} />}
          {mode?.kind === 'remove' && <RemoveLiquidityPanel pools={pools} card={mode.card} onDone={done} onCancel={() => setMode(null)} />}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your positions</h3>
            {mode?.kind !== 'add' && (
              <button type="button" className="rounded-xl px-3 py-1.5 text-sm font-semibold text-white" style={PRIMARY_BTN} onClick={() => setMode({ kind: 'add' })} data-testid="liquidity-new">
                + Add liquidity
              </button>
            )}
          </div>
          {pools.loading || pools.lpLoading ? (
            <div className="h-24 animate-pulse rounded-2xl border" style={panel} data-testid="positions-loading" />
          ) : positions.length === 0 ? (
            <div className="rounded-2xl border p-6 text-center text-sm" style={panel} data-testid="positions-empty">
              <p style={{ color: 'var(--text-primary)' }}>You haven&apos;t added liquidity yet.</p>
              <p className="mt-1" style={muted}>Pick a pool, add both tokens, and earn part of every swap fee.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {positions.map((c) => (
                <div key={c.poolHex} className="rounded-2xl border p-4" style={panel} data-testid="position-card" data-pair={c.pairLabel}>
                  <div className="flex items-center gap-3">
                    <BoingTokenPairIcons a={c.tokenA.symbol} b={c.tokenB.symbol} />
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.pairLabel}</span>
                    <span className="ml-auto text-sm font-medium" style={{ color: 'var(--finance-primary)' }} data-testid="position-share">{c.sharePct} of pool</span>
                  </div>
                  <p className="mt-3 text-xs" style={muted}>If you withdraw everything you get back</p>
                  <p className="tabular-nums text-sm" style={{ color: 'var(--text-primary)' }} data-testid="position-back">
                    {formatTokenAmount(c.youA, c.decimalsA ?? 0, 4)} {c.tokenA.symbol} + {formatTokenAmount(c.youB, c.decimalsB ?? 0, 4)} {c.tokenB.symbol}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={PRIMARY_BTN} onClick={() => setMode({ kind: 'add', card: c })} data-testid="position-add">Add</button>
                    <button type="button" className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setMode({ kind: 'remove', card: c })} data-testid="position-remove">Remove</button>
                  </div>
                  <PoolDetails card={c} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
