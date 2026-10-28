import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useChainType } from '../contexts/SolanaWalletContext';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { boingJsonRpc } from '../services/boingTestnetRpc';

/** A block older than this means the testnet has stopped producing blocks. */
export const STALE_AFTER_MS = 10 * 60 * 1000;
const POLL_MS = 60 * 1000;
const RPC_TIMEOUT_MS = 8000;

/** Pages that read from or write to the Boing testnet. Bridge and the marketing pages stay quiet. */
const BOING_PAGES = ['/swap', '/pools', '/liquidity', '/create-pool', '/deploy-token', '/tokens', '/portfolio', '/activity', '/boing'];

export function formatAge(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h ${mins % 60} min`;
  return `${Math.floor(hours / 24)} days`;
}

/** Reads the testnet tip through the same JSON-RPC client the rest of the app uses. */
export async function fetchTipAge() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RPC_TIMEOUT_MS);
  try {
    const height = await boingJsonRpc('boing_chainHeight', [], { signal: ctrl.signal });
    if (typeof height !== 'number') return null;
    const block = await boingJsonRpc('boing_getBlockByHeight', [height, false], { signal: ctrl.signal });
    const ts = Number(block?.header?.timestamp ?? block?.timestamp);
    if (!Number.isFinite(ts) || ts <= 0) return null;
    return { height, ageMs: Date.now() - ts * 1000 };
  } catch {
    // RPC unreachable: say nothing rather than guess.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Dismissible notice shown when the Boing testnet tip is more than 10 minutes old.
 * Silent when the RPC cannot be reached. Testnet only; makes no claim about mainnet.
 */
export default function ChainStaleBanner({ force = false }) {
  const { pathname } = useLocation();
  const { isBoing } = useChainType();
  const { chainId } = useWallet();
  const onBoing = isBoing || Number(chainId) === BOING_NATIVE_L1_CHAIN_ID;
  const relevant = force || (onBoing && BOING_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
  const [tip, setTip] = useState(null);
  const [dismissedAt, setDismissedAt] = useState(() => {
    try {
      return Number(sessionStorage.getItem('boing_stale_banner_dismissed')) || 0;
    } catch {
      return 0;
    }
  });

  const check = useCallback(async () => {
    const t = await fetchTipAge();
    setTip(t);
  }, []);

  useEffect(() => {
    if (!relevant) return undefined;
    check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, [relevant, check]);

  const stale = tip && tip.ageMs > STALE_AFTER_MS;
  // Dismissal is remembered per stalled height, so a new stall shows the banner again.
  const dismissed = stale && dismissedAt === tip.height;

  const dismiss = () => {
    if (!tip) return;
    setDismissedAt(tip.height);
    try {
      sessionStorage.setItem('boing_stale_banner_dismissed', String(tip.height));
    } catch {
      /* ignore */
    }
  };

  return (
    <div role="status" aria-live="polite">
      {relevant && stale && !dismissed && (
        <div
          data-testid="chain-stale-banner"
          className="mx-auto mt-3 flex w-[min(100%-2rem,72rem)] items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'rgba(245, 158, 11, 0.55)', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--text-primary)' }}
        >
          <p className="flex-1">
            <strong>Testnet block production looks stalled — last block {formatAge(tip.ageMs)} ago</strong> (height {tip.height}).
            Swaps, pool changes and faucet requests on Boing testnet may not confirm until blocks resume.{' '}
            <Link to="/status" className="underline">See status</Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss stalled testnet notice"
            className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
