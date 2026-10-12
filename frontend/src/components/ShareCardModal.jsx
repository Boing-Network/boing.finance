import React from 'react';
import { shareSwapOnTwitter, sharePoolOnTwitter, shareDeployOnTwitter, copySwapShareText, copyPoolShareText } from '../utils/socialSharing';
import toast from 'react-hot-toast';
import useEscapeKey from '../hooks/useEscapeKey';

/**
 * Modal to share swap, pool, or deploy success as a card (Twitter-ready text + copy).
 */
export default function ShareCardModal({ isOpen, onClose, type, data }) {
  useEscapeKey(isOpen, onClose);
  if (!isOpen || !data) return null;

  const handleTwitter = () => {
    if (type === 'swap') shareSwapOnTwitter(data);
    else if (type === 'pool') sharePoolOnTwitter(data);
    else if (type === 'deploy') shareDeployOnTwitter(data);
    toast.success('Opening Twitter...');
  };

  const handleCopy = async () => {
    let ok = false;
    if (type === 'swap') ok = await copySwapShareText(data);
    else if (type === 'pool') ok = await copyPoolShareText(data);
    else if (type === 'deploy') {
      const text = `Just deployed ${data.name} (${data.symbol}) on boing.finance! ${data.address}`;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch { ok = false; }
    }
    if (ok) toast.success('Copied to clipboard!');
    else toast.error('Failed to copy');
  };

  const getCardContent = () => {
    if (type === 'swap') {
      return (
        <div className="td-panel-surface">
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Swap on boing.finance</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {data.amountIn} {data.tokenIn} → {data.amountOut} {data.tokenOut}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Share your swap</p>
        </div>
      );
    }
    if (type === 'pool') {
      return (
        <div className="td-panel-surface">
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Liquidity on boing.finance</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.pair}</p>
          {data.chainName && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{data.chainName}</p>}
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Share your pool</p>
        </div>
      );
    }
    if (type === 'deploy') {
      return (
        <div className="td-panel-surface">
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Token deployed</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.name} ({data.symbol})</p>
          <p className="text-xs mt-1 font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{data.address}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Share your token</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="td-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
    >
      <div
        className="td-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id="share-card-title" className="td-modal__title">Share</h3>
          <button type="button" onClick={onClose} className="text-2xl leading-none hover:opacity-80" style={{ color: 'var(--text-tertiary)' }} aria-label="Close">&times;</button>
        </div>
        <div className="mb-4">{getCardContent()}</div>
        <div className="td-modal__actions" style={{ justifyContent: 'stretch' }}>
          <button
            type="button"
            onClick={handleTwitter}
            className="td-btn td-btn--primary flex-1"
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="td-btn td-btn--ghost flex-1"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
