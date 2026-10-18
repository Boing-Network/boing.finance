import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import BoingTokenPairIcons from './BoingTokenPairIcons';
import { filterPoolCards } from '../services/boingPoolsSimple';
import { formatWhole } from '../services/boingSwapQuote';

const panel = { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' };
const muted = { color: 'var(--text-tertiary)' };

async function copy(label, text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy');
  }
}

export function PoolCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border p-4" style={panel} data-testid="pool-card-skeleton" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="h-8 w-12 rounded-full" style={{ background: 'var(--border-color)' }} />
        <div className="h-5 w-32 rounded" style={{ background: 'var(--border-color)' }} />
      </div>
      <div className="mt-4 h-4 w-3/4 rounded" style={{ background: 'var(--border-color)' }} />
      <div className="mt-2 h-4 w-1/2 rounded" style={{ background: 'var(--border-color)' }} />
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 rounded-xl" style={{ background: 'var(--border-color)' }} />
        <div className="h-9 flex-1 rounded-xl" style={{ background: 'var(--border-color)' }} />
      </div>
    </div>
  );
}

/** Small "Details" expander: the only place a pool shows an address. */
export function PoolDetails({ card }) {
  return (
    <details className="mt-3 text-xs" style={muted}>
      <summary className="cursor-pointer select-none">Details</summary>
      <div className="mt-2 space-y-1 break-all">
        {[
          ['Pool', card.poolHex],
          [card.tokenA.symbol, card.tokenA.id],
          [card.tokenB.symbol, card.tokenB.id],
        ].map(([k, v]) => (
          <div key={k + v} className="flex items-start gap-2">
            <span className="w-14 shrink-0">{k}</span>
            <code className="flex-1 font-mono">{v}</code>
            <button type="button" className="shrink-0 underline" onClick={() => copy(`${k} address`, v)}>
              Copy
            </button>
          </div>
        ))}
        <div>Swap fee {(Number(card.feeBps) / 100).toFixed(2)}% · goes to liquidity providers</div>
      </div>
    </details>
  );
}

function PoolCard({ card, onAdd, onSwap }) {
  const [flip, setFlip] = useState(false);
  return (
    <div className="rounded-2xl border p-4" style={panel} data-testid="pool-card" data-pair={card.pairLabel}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <BoingTokenPairIcons a={card.tokenA.symbol} b={card.tokenB.symbol} />
          <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }} data-testid="pool-pair">
            {card.pairLabel}
          </span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ ...muted, border: '1px solid var(--border-color)' }}>
          {(Number(card.feeBps) / 100).toFixed(2)}% fee
        </span>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt style={muted}>Total liquidity</dt>
          <dd className="text-right tabular-nums" style={{ color: 'var(--text-primary)' }} data-testid="pool-liquidity">
            {card.liquidityLine}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt style={muted}>Price</dt>
          <dd className="text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
            <button
              type="button"
              className="hover:underline"
              title="Flip price"
              onClick={() => setFlip((f) => !f)}
              data-testid="pool-price"
            >
              {flip && card.priceLineInverse ? card.priceLineInverse : card.priceLine} ⇄
            </button>
          </dd>
        </div>
        {card.sharePct && (
          <div className="flex justify-between gap-3">
            <dt style={muted}>Your share</dt>
            <dd className="text-right tabular-nums font-medium" style={{ color: 'var(--finance-primary)' }} data-testid="pool-share">
              {card.sharePct} · {formatWhole(card.youA)} {card.tokenA.symbol} + {formatWhole(card.youB)} {card.tokenB.symbol}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)' }}
          onClick={() => onAdd(card)}
          data-testid="pool-add"
        >
          Add liquidity
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          onClick={() => onSwap(card)}
          data-testid="pool-swap"
          disabled={card.empty}
        >
          Swap
        </button>
      </div>
      <PoolDetails card={card} />
    </div>
  );
}

/**
 * Pools tab: searchable pool cards (pair, liquidity, price, your share) with Add liquidity / Swap,
 * plus a "Create a pool" entry. Developer data lives on the Advanced tab.
 */
export default function BoingPoolsTab({ pools, onAddLiquidity, onSwap, initialQuery = '' }) {
  const { cards, loading, error, reload } = pools;
  const [query, setQuery] = useState(initialQuery || '');
  const shown = useMemo(() => filterPoolCards(cards, query), [cards, query]);
  return (
    <div className="space-y-4" data-testid="boing-pools-tab">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by token (e.g. USDC) or paste an address"
          aria-label="Search pools by token"
          className="min-w-0 flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          data-testid="pool-search"
        />
        <Link
          to="/create-pool"
          className="rounded-xl border px-4 py-2 text-center text-sm font-semibold"
          style={{ borderColor: 'var(--finance-primary)', color: 'var(--finance-primary)' }}
          data-testid="pool-create"
        >
          + Create a pool
        </Link>
      </div>
      {error && (
        <div className="rounded-xl border p-3 text-sm" style={{ ...panel, color: '#f87171' }}>
          Couldn&apos;t load pools.{' '}
          <button type="button" className="underline" onClick={reload}>
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center" style={panel} data-testid="pools-empty">
          <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
            {cards.length === 0 ? 'No pools yet' : `No pools match “${query}”`}
          </p>
          <p className="mt-1 text-sm" style={muted}>
            {cards.length === 0 ? 'Be the first: pair two tokens and earn swap fees.' : 'No pool yet for that token — create one.'}
          </p>
          <Link to="/create-pool" className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--finance-primary), #2563eb)' }}>
            Create a pool
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="pool-list">
          {shown.map((c) => (
            <PoolCard key={c.poolHex} card={c} onAdd={onAddLiquidity} onSwap={onSwap} />
          ))}
        </div>
      )}
    </div>
  );
}
