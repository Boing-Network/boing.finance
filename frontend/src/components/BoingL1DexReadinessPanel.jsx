import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBoingL1FullDexReadiness } from '../config/featureSupport';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { BOING_NETWORK_PRODUCT_CAPABILITY_MATRIX_URL } from '../config/boingNetworkDocsUrls';
import { useOptionalBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

const STATUS_STYLE = {
  live: { label: 'live', color: 'rgb(52, 211, 153)', bg: 'rgba(52, 211, 153, 0.12)' },
  partial: { label: 'partial / app-wired', color: 'rgb(96, 165, 250)', bg: 'rgba(96, 165, 250, 0.12)' },
  planned: { label: 'planned', color: 'rgb(251, 191, 36)', bg: 'rgba(251, 191, 36, 0.12)' },
};

/**
 * Collapsible Boing L1 readiness checklist from getBoingL1FullDexReadiness.
 * Shown on chain 6913 trade hub / Native VM tools so users see honest gates vs live paths.
 *
 * @param {{ defaultOpen?: boolean, compact?: boolean }} props
 */
export default function BoingL1DexReadinessPanel({ defaultOpen = false, compact = false }) {
  const dex = useOptionalBoingNativeDexIntegration();
  const effectivePoolHex = dex?.effectivePoolHex;
  const [open, setOpen] = useState(defaultOpen);

  const readiness = useMemo(
    () =>
      getBoingL1FullDexReadiness(BOING_NATIVE_L1_CHAIN_ID, {
        nativeConstantProductPoolHex: effectivePoolHex || null,
      }),
    [effectivePoolHex]
  );

  if (!readiness?.items?.length) return null;

  const live = readiness.items.filter((i) => i.status === 'live').length;
  const partial = readiness.items.filter((i) => i.status === 'partial').length;
  const planned = readiness.items.filter((i) => i.status === 'planned').length;

  return (
    <div
      className={compact ? 'mt-4 rounded-xl border overflow-hidden' : 'mb-6 rounded-xl border overflow-hidden'}
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:opacity-95"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Boing L1 readiness ({live} live · {partial} partial · {planned} planned)
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            App-wired vs needs operator publish (pool / factory / locker ids). Not EVM MetaMask parity.
          </p>
        </div>
        <svg
          className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <ul className="space-y-2 pt-3">
            {readiness.items.map((item) => {
              const st = STATUS_STYLE[item.status] || STATUS_STYLE.planned;
              return (
                <li
                  key={item.id}
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ color: st.color, backgroundColor: st.bg }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.detail}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="text-xs pt-1" style={{ color: 'var(--text-tertiary)' }}>
            Product matrix:{' '}
            <a
              href={BOING_NETWORK_PRODUCT_CAPABILITY_MATRIX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300"
            >
              BOING-NATIVE-PRODUCT-CAPABILITY-MATRIX.md
            </a>
            {' · '}
            <Link to="/bridge" className="text-cyan-400 underline hover:text-cyan-300">
              Bridge scaffold
            </Link>
            {' · '}
            <Link to="/swap#boing-native-trade" className="text-cyan-400 underline hover:text-cyan-300">
              Native trade hub
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
