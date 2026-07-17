import { useEffect } from 'react';

/** Close a modal/dialog when Escape is pressed while `enabled` is true. */
export default function useEscapeKey(enabled, onEscape) {
  useEffect(() => {
    if (!enabled || typeof onEscape !== 'function') return undefined;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [enabled, onEscape]);
}
