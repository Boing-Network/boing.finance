import React, { useMemo, useState } from 'react';

function LetterMark({ mark }) {
  const letter = String(mark || '?').slice(0, 1).toUpperCase();
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        background: 'linear-gradient(135deg, var(--finance-primary), var(--finance-green))',
        color: '#041018',
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/**
 * Compact token picker used inside Swap amount rows.
 */
export default function SwapTokenSelect({
  idPrefix,
  open,
  onToggle,
  selectedSymbol,
  logo,
  tokens,
  loading,
  onSelect,
  getTokenLogo,
  customOpen,
  onToggleCustom,
  customAddress,
  onCustomAddress,
  onImport,
  onCancelCustom,
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(tokens) ? tokens : [];
    if (!q) return list;
    return list.filter(
      (t) =>
        String(t.symbol || '')
          .toLowerCase()
          .includes(q) ||
        String(t.name || '')
          .toLowerCase()
          .includes(q) ||
        String(t.address || '')
          .toLowerCase()
          .includes(q)
    );
  }, [tokens, query]);

  return (
    <div className="relative token-dropdown-container">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors shrink-0"
        style={{
          backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.06))',
          border: '1px solid var(--border-color)',
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <LetterMark mark={logo || selectedSymbol} />
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{selectedSymbol}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-70">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-80 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Select token</h3>
            <label htmlFor={`${idPrefix}-search`} className="sr-only">
              Search tokens
            </label>
            <input
              id={`${idPrefix}-search`}
              name={`${idPrefix}Search`}
              type="text"
              autoComplete="off"
              placeholder="Search symbol, name, or address"
              className="td-field__input text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="p-2">
            <h4 className="text-xs font-medium mb-2 px-2" style={{ color: 'var(--text-tertiary)' }}>My tokens</h4>
            {loading ? (
              <div className="text-sm px-2 py-1" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
            ) : filtered.length > 0 ? (
              filtered.map((token) => {
                if (!token || !token.symbol || !token.name) return null;
                return (
                  <button
                    key={token.address || token.symbol}
                    type="button"
                    onClick={() => onSelect(token)}
                    className="w-full flex items-center justify-between p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--finance-primary) 12%, transparent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <LetterMark mark={getTokenLogo?.(token.symbol) || token.symbol} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{token.symbol}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{token.name}</div>
                      </div>
                    </div>
                    <div className="text-sm tabular-nums ml-2">
                      {token.formattedBalance || '0'}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-sm px-2 py-1" style={{ color: 'var(--text-tertiary)' }}>No tokens found</div>
            )}

            {customOpen && (
              <div className="mb-2 px-2 space-y-2 border-t pt-2 mt-2" style={{ borderColor: 'var(--border-color)' }}>
                <label htmlFor={`${idPrefix}-custom`} className="sr-only">
                  Token contract address
                </label>
                <input
                  id={`${idPrefix}-custom`}
                  name={`${idPrefix}Custom`}
                  type="text"
                  value={customAddress}
                  onChange={(e) => onCustomAddress(e.target.value)}
                  placeholder="0x… token contract"
                  className="td-field__input text-xs font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onImport()}
                    className="td-btn td-btn--primary flex-1 text-xs"
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={onCancelCustom}
                    className="td-btn td-btn--ghost flex-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onToggleCustom}
              className="td-btn--link w-full flex items-center justify-center p-2 text-sm"
            >
              {customOpen ? 'Hide import' : 'Add custom token'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
