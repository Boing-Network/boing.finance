import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAchievements } from '../contexts/AchievementContext';
import AchievementToast from './AchievementToast';
import Confetti from './Confetti';

/**
 * Renders achievement toast and confetti when user unlocks achievements.
 * Place inside AchievementProvider.
 */
export default function AchievementOverlay() {
  const { recentUnlock, clearRecentUnlock, lightCelebration, clearLightCelebration } = useAchievements();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleDismiss = useCallback(() => {
    clearRecentUnlock();
    setShowConfetti(false);
  }, [clearRecentUnlock]);

  React.useEffect(() => {
    if (recentUnlock) setShowConfetti(true);
  }, [recentUnlock]);

  React.useEffect(() => {
    if (lightCelebration) {
      setShowConfetti(true);
      const t = setTimeout(() => {
        setShowConfetti(false);
        clearLightCelebration();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [lightCelebration, clearLightCelebration]);

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => { setShowConfetti(false); clearLightCelebration(); }} duration={lightCelebration ? 1500 : 2500} />
      <AnimatePresence>
        {recentUnlock && (
          <AchievementToast achievement={recentUnlock} onDismiss={handleDismiss} />
        )}
      </AnimatePresence>
    </>
  );
}
