import React from 'react';
import { shareSwapOnTwitter, sharePoolOnTwitter, shareDeployOnTwitter, copySwapShareText, copyPoolShareText } from '../utils/socialSharing';
import toast from 'react-hot-toast';

/**
 * Modal to share swap, pool, or deploy success as a card (Twitter-ready text + copy).
 */
export default function ShareCardModal({ isOpen, onClose, type, data }) {
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
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
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
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Liquidity on boing.finance</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.pair}</p>
          {data.chainName && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{data.chainName}</p>}
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Share your pool</p>
        </div>
      );
    }
    if (type === 'deploy') {
      return (
        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Token deployed on boing.finance</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.name} ({data.symbol})</p>
          <p className="text-xs mt-1 font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{data.address}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Share your token</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="rounded-2xl p-6 max-w-sm w-full shadow-xl"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Share</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="Close">&times;</button>
        </div>
        <div className="mb-4">{getCardContent()}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTwitter}
            className="flex-1 py-2 rounded-lg font-medium bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white transition-colors"
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 rounded-lg font-medium border transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
