import React from 'react';
import toast from 'react-hot-toast';

/**
 * Token symbol (and optional name) with the full address in the tooltip and a copy button.
 * Falls back to a shortened address when the token has no metadata.
 * @param {{ label: { id: string, symbol: string, name: string, resolved: boolean }, showName?: boolean, copy?: boolean, className?: string }} props
 */
export default function TokenLabel({ label, showName = false, copy = true, className = '' }) {
  if (!label?.id) return <span className={className}>{'\u2014'}</span>;
  const onCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(label.id);
      toast.success(`${label.resolved ? label.symbol : 'Token'} address copied`);
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={label.id} data-testid="token-label" data-token-id={label.id}>
      <span className={label.resolved ? 'font-semibold' : 'font-mono'}>{label.symbol}</span>
      {showName && label.resolved && label.name && label.name !== label.symbol ? (
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          {label.name}
        </span>
      ) : null}
      {copy ? (
        <button
          type="button"
          onClick={onCopy}
          className="text-[10px] underline"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label={`Copy ${label.symbol} address`}
        >
          copy
        </button>
      ) : null}
    </span>
  );
}
