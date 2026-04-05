import React, { useRef, useEffect } from 'react';
import { BoingBackground, BOING_BG_CONFIGS } from '../lib/boing-bg-engine';

/**
 * Route → finance background config key.
 * Home uses the richer landing preset; all other app routes share one calm “feature” preset.
 */
function getFinanceBackgroundVariant(pathname) {
  if (pathname === '/') return 'landing';
  return 'feature';
}

const FINANCE_VARIANTS = ['landing', 'feature', 'trade', 'analytics', 'governance', 'portfolio'];

/**
 * Full-viewport Canvas animated background (Deep Trade).
 * Replaces the static boing-aquatic-space-bg.webp. Home uses `landing`; all other routes use `feature`.
 * When prefers-reduced-motion is set, this component is not rendered and the
 * app falls back to the static .webp (landing) / hex-grid (app pages).
 */
function BoingAnimatedBackground({ variant: variantProp, className = '' }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const variant = variantProp && FINANCE_VARIANTS.includes(variantProp)
    ? variantProp
    : 'landing';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = BOING_BG_CONFIGS.finance[variant] || BOING_BG_CONFIGS.finance.landing;
    const bg = new BoingBackground(canvas, config);
    engineRef.current = bg;
    bg.start();

    return () => {
      bg.stop();
      engineRef.current = null;
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}

export { getFinanceBackgroundVariant };
export default BoingAnimatedBackground;
