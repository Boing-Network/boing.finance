import React from 'react';
import { useAchievements } from '../contexts/AchievementContext';
import { useWallet } from '../contexts/WalletContext';
import { ACHIEVEMENTS } from '../utils/achievements';

/**
 * Compact panel showing points, streak, and badges. Can expand to full list.
 */
export default function AchievementPanel({ compact = true }) {
  const { account } = useWallet();
  const achievements = useAchievements();

  if (!account || !achievements?.getState) return null;

  const { unlocked, points, streak } = achievements.getState(account);
  const allAchievements = Object.values(ACHIEVEMENTS);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{points}</span> pts
        </span>
        {streak > 0 && (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            🔥 {streak}d streak
          </span>
        )}
        <div className="flex -space-x-1">
          {allAchievements.slice(0, 5).map((a) => (
            <span
              key={a.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-gray-800"
              style={{
                backgroundColor: unlocked.includes(a.id) ? 'rgba(34, 211, 238, 0.3)' : 'var(--bg-secondary)',
                opacity: unlocked.includes(a.id) ? 1 : 0.4
              }}
              title={unlocked.includes(a.id) ? a.name : `${a.name} (locked)`}
            >
              {a.icon}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Achievements & Points
        </h3>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{points}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Boing Points</p>
        </div>
        <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{streak}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Day Streak</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allAchievements.map((a) => (
          <div
            key={a.id}
            className="rounded-lg p-2 flex items-center gap-2"
            style={{
              backgroundColor: unlocked.includes(a.id) ? 'rgba(34, 211, 238, 0.1)' : 'var(--bg-secondary)',
              opacity: unlocked.includes(a.id) ? 1 : 0.6
            }}
          >
            <span className="text-xl">{a.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{a.points} pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
