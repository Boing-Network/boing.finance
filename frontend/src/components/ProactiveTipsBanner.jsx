import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useAchievements } from '../contexts/AchievementContext';

/**
 * Proactive contextual tips (idle ETH, gas tips, next steps).
 */
export default function ProactiveTipsBanner() {
  const [tip, setTip] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const { chainId: _chainId } = useWallet();
  const { isConnected, account } = useWalletConnection();
  const { getState } = useAchievements() || {};

  useEffect(() => {
    if (!isConnected || !account || dismissed) {
      setTip(null);
      return;
    }

    const { unlocked = [] } = getState?.(account) || {};
    const ids = unlocked.map((a) => a?.id).filter(Boolean);

    if (!ids.includes('first_swap')) {
      setTip({ text: 'Try your first swap to get started!', cta: '/swap' });
    } else if (!ids.includes('first_liquidity') && !ids.includes('first_pool')) {
      setTip({ text: 'Add liquidity to earn trading fees.', cta: '/pools' });
    } else if (!ids.includes('first_deploy')) {
      setTip({ text: 'Deploy your own token – no coding required.', cta: '/deploy-token' });
    } else {
      setTip({ text: 'Use lower gas when network is busy. Try off-peak times.', cta: null });
    }
  }, [isConnected, account, dismissed, getState]);

  if (!tip) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg border text-sm"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)'
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{tip.text}</span>
      <div className="flex items-center gap-2 shrink-0">
        {tip.cta && (
          <a
            href={tip.cta}
            className="px-3 py-1 rounded font-medium"
            style={{ backgroundColor: 'var(--primary-color)', color: 'var(--bg-primary)' }}
          >
            Go
          </a>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-white/10"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
