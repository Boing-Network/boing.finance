import React, { useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import confetti from 'canvas-confetti';
import {
  BOING_OBSERVER_BASE_URL,
  buildBoingExplorerAccountUrl,
  buildBoingExplorerTxUrl,
} from '../config/boingExplorerUrls';

const ROOT_ID = 'deploy-celebration-root';

let celebrationRoot = null;

function fireDeployConfetti() {
  if (typeof window === 'undefined') return;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  } catch {
    /* ignore */
  }

  const palette = ['#22c55e', '#38bdf8', '#a78bfa', '#fbbf24', '#f472b6', '#34d399'];
  const burst = (opts = {}) => {
    confetti({
      particleCount: 42,
      spread: 68,
      ticks: 220,
      origin: { y: 0.62 },
      colors: palette,
      ...opts,
    });
  };
  burst();
  setTimeout(() => {
    confetti({
      particleCount: 22,
      angle: 60,
      spread: 52,
      origin: { x: 0, y: 0.55 },
      colors: palette,
    });
  }, 180);
  setTimeout(() => {
    confetti({
      particleCount: 22,
      angle: 120,
      spread: 52,
      origin: { x: 1, y: 0.55 },
      colors: palette,
    });
  }, 360);
  setTimeout(() => burst({ particleCount: 36, spread: 80 }), 520);
}

/**
 * @param {object} p
 * @param {string} [p.title]
 * @param {string} p.deploymentKind
 * @param {Array<{ label: string, value: string }>} [p.details]
 * @param {string} [p.txHash]
 * @param {string | null | undefined} [p.boingTxIdHex]
 * @param {string | null | undefined} [p.contractAddress]
 * @param {string | null | undefined} [p.explorerBaseUrl]
 * @param {string | null | undefined} [p.externalTxUrl]
 * @param {string | null | undefined} [p.externalAddressUrl]
 * @param {string | null | undefined} [p.evmExplorerBaseUrl] — e.g. https://sepolia.etherscan.io for EVM contract/tx links
 * @param {Array<{ label: string, href: string }>} [p.links] — if set, used instead of auto-built explorer links
 * @param {() => void} p.onClose
 */
function isLikelyEvmAddress(a) {
  return typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a.trim());
}

function DeployCelebrationModal({
  onClose,
  title = 'Congratulations!',
  deploymentKind,
  details = [],
  txHash,
  boingTxIdHex,
  contractAddress,
  explorerBaseUrl,
  externalTxUrl,
  externalAddressUrl,
  evmExplorerBaseUrl,
  links: linksProp,
}) {
  useEffect(() => {
    fireDeployConfetti();
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const links = React.useMemo(() => {
    if (Array.isArray(linksProp) && linksProp.length > 0) return linksProp.filter((l) => l?.href);
    const out = [];
    if (externalTxUrl) {
      out.push({ label: 'View transaction', href: externalTxUrl });
    } else if (txHash && typeof txHash === 'string' && txHash.trim() && evmExplorerBaseUrl) {
      const b = String(evmExplorerBaseUrl).replace(/\/+$/, '');
      out.push({ label: 'View transaction', href: `${b}/tx/${txHash.trim()}` });
    } else if (boingTxIdHex && typeof boingTxIdHex === 'string' && boingTxIdHex.trim()) {
      out.push({
        label: 'View transaction',
        href: buildBoingExplorerTxUrl(explorerBaseUrl || BOING_OBSERVER_BASE_URL, boingTxIdHex),
      });
    }
    if (externalAddressUrl) {
      out.push({ label: 'View contract', href: externalAddressUrl });
    } else if (contractAddress && typeof contractAddress === 'string' && contractAddress.trim()) {
      const ca = contractAddress.trim();
      if (isLikelyEvmAddress(ca) && evmExplorerBaseUrl) {
        const b = String(evmExplorerBaseUrl).replace(/\/+$/, '');
        out.push({ label: 'View contract', href: `${b}/address/${ca}` });
      } else if (!isLikelyEvmAddress(ca)) {
        out.push({
          label: 'View on explorer',
          href: buildBoingExplorerAccountUrl(explorerBaseUrl || BOING_OBSERVER_BASE_URL, ca),
        });
      }
    }
    return out;
  }, [
    linksProp,
    externalTxUrl,
    txHash,
    evmExplorerBaseUrl,
    boingTxIdHex,
    explorerBaseUrl,
    externalAddressUrl,
    contractAddress,
  ]);

  return (
    <div
      className="fixed inset-0 z-[25000] flex items-center justify-center bg-black/60 p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border shadow-2xl outline-none"
        style={{
          backgroundColor: 'var(--bg-card, #0f172a)',
          borderColor: 'var(--border-color, #334155)',
          color: 'var(--text-primary, #f8fafc)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deploy-celebration-title"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-1 text-center text-4xl" aria-hidden>
            🎉
          </div>
          <h2
            id="deploy-celebration-title"
            className="mb-2 text-center text-2xl font-bold"
            style={{ color: 'var(--finance-green-mid, #22c55e)' }}
          >
            {title}
          </h2>
          <p className="mb-6 text-center text-sm" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
            {deploymentKind} was submitted successfully on Boing Finance.
          </p>

          <div
            className="mb-6 space-y-3 rounded-xl border p-4 text-sm"
            style={{ borderColor: 'var(--border-color, #334155)', backgroundColor: 'var(--bg-tertiary, #1e293b)' }}
          >
            {details.length > 0 ? (
              <dl className="space-y-2">
                {details.map((row, i) => (
                  <div key={`${row.label}-${i}`} className="grid gap-1 sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-start">
                    <dt className="font-medium" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>
                      {row.label}
                    </dt>
                    <dd className="min-w-0 break-all font-mono text-xs" title={row.value}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {(txHash || boingTxIdHex) && (
              <div className="border-t border-white/10 pt-3">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  Transaction
                </div>
                <div className="break-all font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {boingTxIdHex && String(boingTxIdHex).trim()
                    ? String(boingTxIdHex).trim()
                    : txHash || '—'}
                </div>
              </div>
            )}
          </div>

          {links.length > 0 ? (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--finance-primary, #3b82f6)' }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--finance-green-mid, #22c55e)' }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-screen celebration with confetti + deployment summary (tx hash, token info, explorer links).
 * @param {object} payload — props for {@link DeployCelebrationModal} except `onClose`
 */
export function showDeployCelebration(payload) {
  if (typeof document === 'undefined') return;

  let el = document.getElementById(ROOT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = ROOT_ID;
    document.body.appendChild(el);
  }

  if (celebrationRoot) {
    celebrationRoot.unmount();
    celebrationRoot = null;
  }

  const close = () => {
    try {
      celebrationRoot?.unmount();
    } catch {
      /* ignore */
    }
    celebrationRoot = null;
    el?.remove();
  };

  celebrationRoot = createRoot(el);
  celebrationRoot.render(<DeployCelebrationModal {...payload} onClose={close} />);
}
