import React, { useState, useEffect } from 'react';

const IMAGES_BASE = `${process.env.PUBLIC_URL || ''}/images`;
const HERO_OPTIMIZED = `${IMAGES_BASE}/hero_optimized.png`;

/**
 * Full Boing hero robot + environment (from enhance_hero.py). One cohesive
 * layer in the background with float animation. Presence across the app.
 */
function BoingHeroScene() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => {};
    img.src = HERO_OPTIMIZED;
  }, []);

  if (!loaded) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1000px' }}
      aria-hidden
    >
      <img
        src={HERO_OPTIMIZED}
        alt=""
        className="boing-hero-scene-layer"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 'auto',
          height: 'min(70vh, 900px)',
          maxWidth: '55vw',
          objectFit: 'contain',
          objectPosition: '100% 100%',
          opacity: 0.24,
          filter: 'drop-shadow(0 0 30px var(--glow-cyan-soft))',
        }}
      />
      <style>{`
        @keyframes boing-hero-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.015); }
        }
        .boing-hero-scene-layer {
          animation: boing-hero-float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default BoingHeroScene;
