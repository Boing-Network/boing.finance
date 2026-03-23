import React, { useRef, useEffect } from 'react';
import { BoingBackground, BOING_BG_CONFIGS } from '../lib/boing-bg-engine';

/**
 * Route → finance background config key.
 * Used to pick the right animated background per page.
 */
function getFinanceBackgroundVariant(pathname) {
  if (pathname === '/') return 'landing';
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/governance')) return 'governance';
  return 'trade'; // swap, liquidity, bridge, tokens, deploy-token, etc.
}

const FINANCE_VARIANTS = ['landing', 'trade', 'analytics', 'governance', 'portfolio'];

/**
 * Full-viewport Canvas animated background (Deep Trade).
 * Replaces the static boing-aquatic-space-bg.webp; config switches by route.
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
