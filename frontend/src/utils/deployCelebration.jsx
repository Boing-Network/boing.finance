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

/** Confetti canvas above celebration overlay (modal uses z-[25000]). */
const DEPLOY_CONFETTI_Z = 26050;

/**
 * Main-thread renderer only. The package default uses `useWorker: true`; this file fires
 * many `confetti()` calls back-to-back. With the worker, the first burst completion can run
 * `done()` and detach the canvas while later bursts are still queued, so particles often
 * never appear (noticed on deploy flows such as native token submit).
 */
const deployConfetti = confetti.create(null, { resize: true, useWorker: false });

/** Lazy rasterized emoji confetti (canvas-confetti); empty array if unsupported. */
let cachedPinataTextShapes = null;

function resolvePinataTextShapes() {
  if (cachedPinataTextShapes !== null) return cachedPinataTextShapes;
  try {
    if (typeof confetti.shapeFromText !== 'function') {
      cachedPinataTextShapes = [];
      return cachedPinataTextShapes;
    }
    const defs = [
      { text: '🍬', scalar: 1.2 },
      { text: '🍭', scalar: 1.2 },
      { text: '🍫', scalar: 1.15 },
      { text: '✨', scalar: 1.0 },
      { text: '🎊', scalar: 1.15 },
      { text: '🎉', scalar: 1.15 },
      { text: '🥳', scalar: 1.1 },
      { text: '⭐', scalar: 1.05 },
    ];
    cachedPinataTextShapes = defs.map((d) => confetti.shapeFromText(d));
  } catch {
    cachedPinataTextShapes = [];
  }
  return cachedPinataTextShapes;
}

function mixShapes(emojiShapes, geometryShapes) {
  if (!emojiShapes.length) return geometryShapes;
  return [...emojiShapes, ...geometryShapes, ...geometryShapes, ...emojiShapes.slice(0, 3)];
}

/**
 * Piñata-style burst: radial pops, emoji “candy”, screen-edge rim salvos,
 * streamers, rain, and late encore — tuned for deployment celebrations.
 */
function fireDeployConfetti() {
  if (typeof window === 'undefined') return;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  } catch {
    /* ignore */
  }

  const candy = [
    '#ef4444',
    '#f97316',
    '#facc15',
    '#84cc16',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#38bdf8',
    '#818cf8',
    '#a78bfa',
    '#e879f9',
    '#f472b6',
    '#fb7185',
  ];
  const gold = ['#fde047', '#facc15', '#fbbf24', '#fcd34d', '#fef08a'];
  const geometry = ['star', 'circle', 'square', 'circle', 'square'];
  const emojiShapes = resolvePinataTextShapes();
  const wildShapes = mixShapes(emojiShapes, geometry);

  const burst = (opts) => {
    deployConfetti({
      zIndex: DEPLOY_CONFETTI_Z,
      gravity: 1.1,
      decay: 0.89,
      ticks: 340,
      ...opts,
    });
  };

  const pop = { x: 0.5, y: 0.4 };

  // Floor cannon — confetti shoots up through the burst (extra drama)
  burst({
    particleCount: 55,
    angle: 90,
    spread: 55,
    startVelocity: 62,
    origin: { x: 0.5, y: 0.98 },
    colors: candy,
    shapes: geometry,
    ticks: 420,
  });

  // Main radial explosion (piñata splits open)
  burst({
    particleCount: 200,
    spread: 360,
    startVelocity: 62,
    scalar: 1.12,
    shapes: wildShapes,
    colors: candy,
    origin: pop,
    ticks: 400,
  });

  // Emoji-heavy candy cloud (match scalar to shapeFromText for sharp sprites)
  if (emojiShapes.length) {
    burst({
      particleCount: 55,
      spread: 360,
      startVelocity: 44,
      scalar: 1.2,
      shapes: emojiShapes,
      colors: [...gold, ...candy],
      origin: pop,
      ticks: 380,
    });
  }

  // Inner flash — gold / lighter chips
  burst({
    particleCount: 110,
    spread: 360,
    startVelocity: 50,
    scalar: 0.88,
    shapes: emojiShapes.length ? [...emojiShapes.slice(0, 4), 'circle', 'square', 'star'] : geometry,
    colors: gold,
    origin: pop,
    ticks: 380,
  });

  // Side streamers (strings ripping off)
  window.setTimeout(() => {
    burst({
      particleCount: 62,
      angle: 58,
      spread: 72,
      startVelocity: 56,
      origin: { x: 0.1, y: 0.5 },
      colors: candy,
      shapes: wildShapes,
      drift: 0.38,
    });
    burst({
      particleCount: 62,
      angle: 122,
      spread: 72,
      startVelocity: 56,
      origin: { x: 0.9, y: 0.5 },
      colors: candy,
      shapes: wildShapes,
      drift: -0.38,
    });
  }, 55);

  // Secondary pop — debris
  window.setTimeout(() => {
    burst({
      particleCount: 90,
      spread: 360,
      startVelocity: 38,
      scalar: 0.78,
      origin: { x: 0.5, y: 0.44 },
      colors: candy,
      shapes: wildShapes,
      gravity: 1.05,
      ticks: 420,
    });
  }, 120);

  // Mid encore — smaller radial with stars + emojis
  window.setTimeout(() => {
    burst({
      particleCount: emojiShapes.length ? 70 : 50,
      spread: 360,
      startVelocity: 34,
      scalar: emojiShapes.length ? 1.05 : 0.9,
      origin: { x: 0.5, y: 0.42 },
      shapes: emojiShapes.length ? [...emojiShapes, 'star', 'star', 'circle'] : ['star', 'star', 'circle'],
      colors: [...candy.slice(4), ...gold],
      ticks: 360,
    });
  }, 175);

  // Sparkle shower from above
  window.setTimeout(() => {
    burst({
      particleCount: 100,
      angle: 270,
      spread: 58,
      startVelocity: 24,
      origin: { x: 0.5, y: 0.1 },
      scalar: 0.72,
      colors: [...gold, ...candy.slice(0, 5)],
      shapes: emojiShapes.length ? [...emojiShapes.slice(2, 6), 'circle', 'star'] : geometry,
      ticks: 500,
      gravity: 0.92,
    });
  }, 220);

  // Cross-screen “sweep” (left + right mid-height)
  window.setTimeout(() => {
    burst({
      particleCount: 45,
      angle: 25,
      spread: 48,
      startVelocity: 50,
      origin: { x: 0.02, y: 0.55 },
      colors: candy,
      shapes: wildShapes,
    });
    burst({
      particleCount: 45,
      angle: 155,
      spread: 48,
      startVelocity: 50,
      origin: { x: 0.98, y: 0.55 },
      colors: candy,
      shapes: wildShapes,
    });
  }, 280);

  // Final star punch
  window.setTimeout(() => {
    burst({
      particleCount: 58,
      spread: 360,
      startVelocity: 34,
      origin: { x: 0.5, y: 0.48 },
      shapes: emojiShapes.length ? ['star', 'star', ...emojiShapes.slice(0, 3)] : ['star', 'star', 'circle'],
      colors: gold,
      ticks: 340,
    });
  }, 380);

  /**
   * Rim burst: staggered salvos from screen edges toward center (piñata fallout hitting the room).
   * Angles are canvas-confetti convention (90 = up).
   */
  const rimVolley = (delayMs, particleEach, velocity) => {
    const rim = [
      { x: 0.04, y: 0.18, angle: 55, spread: 58 },
      { x: 0.96, y: 0.18, angle: 125, spread: 58 },
      { x: 0.04, y: 0.82, angle: 42, spread: 58 },
      { x: 0.96, y: 0.82, angle: 138, spread: 58 },
      { x: 0.5, y: 0.04, angle: 95, spread: 52 },
      { x: 0.5, y: 0.96, angle: 275, spread: 52 },
      { x: 0.04, y: 0.5, angle: 12, spread: 55 },
      { x: 0.96, y: 0.5, angle: 168, spread: 55 },
    ];
    rim.forEach((r, i) => {
      window.setTimeout(() => {
        burst({
          particleCount: particleEach,
          angle: r.angle,
          spread: r.spread,
          startVelocity: velocity,
          origin: { x: r.x, y: r.y },
          colors: i % 2 === 0 ? candy : [...gold, ...candy.slice(0, 6)],
          shapes: wildShapes,
          ticks: 420,
          drift: [0, 0.26, -0.26][i % 3],
        });
      }, delayMs + i * 32);
    });
  };

  // First rim wave — corners + cardinals
  rimVolley(460, 42, 48);

  // Second rim wave — softer, more gold (late pinata echo)
  window.setTimeout(() => {
    rimVolley(0, 28, 38);
  }, 620);

  // Late pure-emoji sprinkle (tiny treats drifting)
  if (emojiShapes.length) {
    window.setTimeout(() => {
      burst({
        particleCount: 40,
        spread: 360,
        startVelocity: 22,
        scalar: 1.05,
        shapes: emojiShapes,
        colors: gold,
        origin: { x: 0.5, y: 0.38 },
        gravity: 0.88,
        ticks: 520,
      });
    }, 720);

    window.setTimeout(() => {
      burst({
        particleCount: 35,
        angle: 270,
        spread: 70,
        startVelocity: 16,
        scalar: 1.1,
        shapes: emojiShapes.slice(0, 5),
        colors: candy,
        origin: { x: 0.5, y: 0.08 },
        ticks: 550,
        gravity: 0.85,
      });
    }, 800);
  }
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
