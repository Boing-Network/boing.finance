import { useEffect, useRef } from 'react';

/**
 * Calls onClose when the user taps/clicks outside any element matched by isInsideTarget(node).
 * Uses capture phase so it wins over nested handlers and works with portaled menus.
 *
 * @param {boolean} isActive
 * @param {(node: EventTarget | null) => boolean} isInsideTarget - return true if click should NOT close
 * @param {() => void} onClose
 */
export function useCloseOnPointerOutside(isActive, isInsideTarget, onClose) {
  const onCloseRef = useRef(onClose);
  const insideRef = useRef(isInsideTarget);
  onCloseRef.current = onClose;
  insideRef.current = isInsideTarget;

  useEffect(() => {
    if (!isActive) return;

    const handler = (event) => {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (insideRef.current(t)) return;
      onCloseRef.current();
    };

    document.addEventListener('mousedown', handler, true);
    document.addEventListener('touchstart', handler, true);
    return () => {
      document.removeEventListener('mousedown', handler, true);
      document.removeEventListener('touchstart', handler, true);
    };
  }, [isActive]);
}
