import React, { useState, useEffect } from 'react';

const ASSETS_BASE = `${process.env.PUBLIC_URL || ''}/assets`;
const MASCOT_SRC = `${ASSETS_BASE}/mascot-default.png`;

/**
 * Boing mascot (transparent PNG) as a background layer with float animation.
 * Replaces the previous hero robot + coral reef image for a cleaner look.
 */
function BoingHeroScene() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => {};
    img.src = MASCOT_SRC;
  }, []);

  if (!loaded) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1000px' }}
      aria-hidden
    >
      <img
        src={MASCOT_SRC}
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
