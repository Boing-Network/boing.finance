import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!achievement) return null;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))] left-[max(1rem,env(safe-area-inset-left,0px))] sm:left-auto z-[100] max-w-sm rounded-xl border shadow-xl flex items-center gap-4 p-4"
      style={{
        background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
        borderColor: 'var(--glow-cyan)'
      }}
    >
      <div className="text-4xl">{achievement.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Achievement Unlocked
        </p>
        <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
          {achievement.name}
        </p>
        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
          +{achievement.points} Boing Points
        </p>
      </div>
      <button type="button" onClick={onDismiss} className="p-1 rounded hover:bg-white/10" aria-label="Dismiss">
        &times;
      </button>
    </motion.div>
  );
}
