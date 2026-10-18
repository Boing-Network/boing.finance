import React, { useMemo, useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import TokenLogo from './TokenLogo';
import VirtualList from './VirtualList';
import { canSignOnChainType, chainTypeLabel, searchChains } from '../../utils/lifiCore';

/**
 * Network selector listing every LI.FI chain (logo, name, chain type). On the sending side, chains the app's
 * wallets cannot sign on (Bitcoin, Sui, Tron, …) are labelled "Receive only".
 */
export default function ChainPicker({ label, side, chains, value, onChange, loading, error, onRetry }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEscapeKey(open, () => setOpen(false));
  const selected = chains.find((c) => c.id === value);
  const list = useMemo(() => searchChains(chains, query), [chains, query]);
  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="td-field__input flex w-full items-center gap-3 text-left text-sm sm:text-base font-medium"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        aria-haspopup="dialog"
        aria-label={`${label}: ${selected?.name || 'choose a network'}`}
        data-testid={`bridge-chain-${side}`}
      >
        {selected ? <TokenLogo src={selected.logoURI} label={selected.name} size={24} /> : null}
        <span className="flex-1 truncate">{selected?.name || (loading ? 'Loading networks…' : 'Choose a network')}</span>
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={`${label} network`} onClick={close}>
          <div
            className="w-full max-w-md rounded-2xl p-4 sm:p-5 shadow-xl"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
            data-testid={`bridge-chain-modal-${side}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {side === 'from' ? 'Send from' : 'Receive on'}
              </h2>
              <button type="button" onClick={close} className="td-icon-btn" aria-label="Close">
                ×
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search networks"
              aria-label="Search networks"
              className="td-field__input mb-2 w-full text-sm"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              data-testid={`bridge-chain-search-${side}`}
            />
            <p className="mb-2 text-xs" style={{ color: 'var(--text-tertiary)' }} data-testid={`bridge-chain-count-${side}`}>
              {loading ? 'Loading networks…' : `${list.length} of ${chains.length} networks`}
            </p>
            {error ? (
              <div className="td-callout td-callout--warn" role="alert">
                <p className="td-callout__body">{error}</p>
                {onRetry && (
                  <button type="button" className="td-btn td-btn--ghost mt-2 text-sm" onClick={onRetry}>
                    Try again
                  </button>
                )}
              </div>
            ) : (
              <VirtualList
                items={list}
                rowHeight={52}
                height={420}
                getKey={(c) => c.id}
                testId={`bridge-chain-list-${side}`}
                renderRow={(c) => {
                  const receiveOnly = side === 'from' && !canSignOnChainType(c.chainType);
                  const active = c.id === value;
                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(c.id);
                        close();
                      }}
                      className="flex h-full w-full items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                      style={active ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
                      data-testid="bridge-chain-option"
                      data-chain-id={c.id}
                      data-chain-name={c.name}
                    >
                      <TokenLogo src={c.logoURI} label={c.name} size={28} />
                      <span className="flex-1 truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                        {c.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {receiveOnly ? 'Receive only' : chainTypeLabel(c.chainType)}
                      </span>
                    </button>
                  );
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
