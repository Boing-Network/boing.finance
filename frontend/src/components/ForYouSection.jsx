import React from 'react';
import { Link } from 'react-router-dom';
import { useAchievements } from '../contexts/AchievementContext';
import { useWalletConnection } from '../hooks/useWalletConnection';

/**
 * "For You" personalized recommendations based on achievements and wallet state.
 */
export default function ForYouSection() {
  const { getState } = useAchievements() || {};
  const { isConnected, account } = useWalletConnection();

  if (!isConnected || !account) {
    return (
      <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>For you</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to get personalized suggestions.</p>
        <Link
          to="/swap"
          className="text-sm font-medium"
          style={{ color: 'var(--primary-color)' }}
        >
          Get started →
        </Link>
      </div>
    );
  }

  const { unlocked = [] } = getState?.(account) || {};
  const ids = unlocked.map((a) => a?.id).filter(Boolean);

  const recommendations = [];
  if (!ids.includes('first_swap')) {
    recommendations.push({ label: 'Try your first swap', href: '/swap', icon: '🔄' });
  }
  if (!ids.includes('first_liquidity') && !ids.includes('first_pool')) {
    recommendations.push({ label: 'Add liquidity to earn', href: '/pools', icon: '🏊' });
  }
  if (!ids.includes('first_deploy')) {
    recommendations.push({ label: 'Deploy your own token', href: '/deploy-token', icon: '🚀' });
  }
  if (!ids.includes('first_bridge')) {
    recommendations.push({ label: 'Bridge across chains', href: '/bridge', icon: '🌉' });
  }
  if (recommendations.length === 0) {
    recommendations.push({ label: 'Explore analytics', href: '/analytics', icon: '📊' });
    recommendations.push({ label: 'Check your portfolio', href: '/portfolio', icon: '💼' });
  }

  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>For you</h3>
      <ul className="space-y-2">
        {recommendations.slice(0, 4).map((r, i) => (
          <li key={i}>
            <Link
              to={r.href}
              className="flex items-center gap-2 text-sm hover:underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
