import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  getUnlockedAchievements,
  unlockAchievement,
  getPoints,
  getStreak,
  updateStreak,
  recordActivity
} from '../utils/achievements';

const AchievementContext = createContext();

export function useAchievements() {
  const ctx = useContext(AchievementContext);
  if (!ctx) return null;
  return ctx;
}

export function AchievementProvider({ children }) {
  const [recentUnlock, setRecentUnlock] = useState(null);
  const [lightCelebration, setLightCelebration] = useState(false);

  const record = useCallback((account, action, achievementId = null) => {
    if (!account) return null;
    const activity = recordActivity(account, action);
    const newStreak = updateStreak(account);
    let unlocked = null;
    if (achievementId) {
      unlocked = unlockAchievement(account, achievementId);
      if (unlocked) setRecentUnlock({ ...unlocked, account });
    }
    return {
      points: getPoints(account),
      streak: newStreak,
      unlocked,
      activityPoints: activity?.points
    };
  }, []);

  const unlock = useCallback((account, achievementId) => {
    if (!account) return null;
    const a = unlockAchievement(account, achievementId);
    if (a) setRecentUnlock({ ...a, account });
    return a;
  }, []);

  const clearRecentUnlock = useCallback(() => setRecentUnlock(null), []);

  const triggerLightCelebration = useCallback(() => {
    setLightCelebration(true);
    setTimeout(() => setLightCelebration(false), 100);
  }, []);

  const clearLightCelebration = useCallback(() => setLightCelebration(false), []);

  const getState = useCallback((account) => ({
    unlocked: getUnlockedAchievements(account),
    points: getPoints(account),
    streak: getStreak(account)
  }), []);

  const value = {
    record,
    unlock,
    getState,
    recentUnlock,
    clearRecentUnlock,
    triggerLightCelebration,
    lightCelebration,
    clearLightCelebration
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}
