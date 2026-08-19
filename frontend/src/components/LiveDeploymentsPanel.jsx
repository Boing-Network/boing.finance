import React from 'react';
import { useChainRealtime } from '../contexts/ChainRealtimeContext';

function shortAddr(value) {
  if (!value || typeof value !== 'string') return '';
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function labelFor(event) {
  if (event.type === 'pair_created') return 'New pool';
  if (event.type === 'token_deployed') return 'Factory deploy';
  if (event.type === 'token_profile') return 'New listing';
  if (event.type === 'solana_mint') return 'Solana mint';
  return event.type || 'Update';
}

function chainLabel(event) {
  return event.chainSlug || (event.chainId != null ? `chain ${event.chainId}` : '');
}

export default function LiveDeploymentsPanel({ className = '' }) {
  const { events, status } = useChainRealtime();
  const live =
    status.alchemy === 'live' || status.dexscreener === 'live' || status.helius === 'live';

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 mb-6 border ${className}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white">Live deployments</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Alchemy factory logs, DexScreener listings, and webhook deploys
          </p>
        </div>
        <span className={`text-xs font-medium ${live ? 'text-emerald-400' : 'text-gray-500'}`}>
          {live ? 'Live' : 'Connecting'}
        </span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-500">Waiting for new tokens and pools on connected chains.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-auto pr-1">
          {events.slice(0, 12).map((event, idx) => (
            <li
              key={`${event.txHash || event.tokenAddress || 'evt'}-${event.ts}-${idx}`}
              className="flex items-start justify-between gap-3 text-sm rounded-lg px-3 py-2"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div className="min-w-0">
                <p className="text-white truncate">
                  {event.symbol || event.name || shortAddr(event.tokenAddress)}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {labelFor(event)}
                  {chainLabel(event) ? ` · ${chainLabel(event)}` : ''}
                  {event.tokenAddress ? ` · ${shortAddr(event.tokenAddress)}` : ''}
                </p>
              </div>
              {event.url ? (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 shrink-0"
                >
                  View
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
