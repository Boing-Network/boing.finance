import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useChainType } from '../contexts/SolanaWalletContext';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { boingJsonRpc } from '../services/boingTestnetRpc';

/**
 * A tip older than this is only worth a neutral note. The Boing node produces a block only when there are
 * transactions to include, so an old tip is normal on a quiet testnet and is not a fault.
 */
export const IDLE_AFTER_MS = 10 * 60 * 1000;
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

/**
 * Reads the testnet tip through the same JSON-RPC client the rest of the app uses.
 * Returns `{ height, ageMs }`, `{ error: true }` when the RPC could not be reached or errored, or null when the
 * reply had no usable block timestamp.
 */
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
    return { error: true };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Info line for the Boing testnet on pages that use it.
 * - Tip older than 10 min: a neutral, dismissible "No transactions recently" note (not a warning).
 * - RPC unreachable or erroring on two checks in a row: a warning, because that is a real problem.
 * Testnet only; makes no claim about mainnet.
 */
export default function ChainIdleNotice({ force = false }) {
  const { pathname } = useLocation();
  const { isBoing } = useChainType();
  const { chainId } = useWallet();
  const onBoing = isBoing || Number(chainId) === BOING_NATIVE_L1_CHAIN_ID;
  const relevant = force || (onBoing && BOING_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
  const [tip, setTip] = useState(null);
  const [rpcDown, setRpcDown] = useState(false);
  const failures = useRef(0);
  const [dismissedAt, setDismissedAt] = useState(() => {
    try {
      return Number(sessionStorage.getItem('boing_idle_notice_dismissed')) || 0;
    } catch {
      return 0;
    }
  });

  const check = useCallback(async () => {
    const t = await fetchTipAge();
    if (t && t.error) {
      failures.current += 1;
      if (failures.current >= 2) setRpcDown(true);
      return;
    }
    failures.current = 0;
    setRpcDown(false);
    setTip(t);
  }, []);

  useEffect(() => {
    if (!relevant) return undefined;
    check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, [relevant, check]);

  const idle = !rpcDown && tip && tip.ageMs > IDLE_AFTER_MS;
  // Dismissal is remembered per tip height, so a newer idle stretch shows the note again.
  const dismissed = idle && dismissedAt === tip.height;

  const dismiss = () => {
    if (!tip) return;
    setDismissedAt(tip.height);
    try {
      sessionStorage.setItem('boing_idle_notice_dismissed', String(tip.height));
    } catch {
      /* ignore */
    }
  };

  return (
    <div role="status" aria-live="polite">
      {relevant && rpcDown && (
        <div
          data-testid="chain-rpc-warning"
          className="mx-auto mt-3 flex w-[min(100%-2rem,72rem)] items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'rgba(245, 158, 11, 0.55)', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--text-primary)' }}
        >
          <p className="flex-1">
            <strong>Boing testnet RPC is not responding.</strong> Balances, swaps and faucet requests may fail until it is
            back. <Link to="/status" className="underline">See status</Link>
          </p>
        </div>
      )}
      {relevant && idle && !dismissed && (
        <div
          data-testid="chain-idle-notice"
          className="mx-auto mt-3 flex w-[min(100%-2rem,72rem)] items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--border-color, rgba(255,255,255,0.14))', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}
        >
          <p className="flex-1">
            <strong style={{ color: 'var(--text-primary)' }}>No transactions recently.</strong> The Boing testnet only
            produces a block when there are transactions to include. Last block {formatAge(tip.ageMs)} ago (height{' '}
            {tip.height}). Submitting a transaction produces the next block.
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss idle-chain notice"
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
