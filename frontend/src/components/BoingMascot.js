import React, { useState, useEffect } from 'react';

const ASSETS_BASE = `${process.env.PUBLIC_URL || ''}/assets`;
const MASCOTS = {
  default: `${ASSETS_BASE}/mascot-default.png`,
  excited: `${ASSETS_BASE}/mascot-excited.png`,
  thinking: `${ASSETS_BASE}/mascot-thinking.png`,
  winking: `${ASSETS_BASE}/mascot-winking.png`,
};
const FALLBACK = `${process.env.PUBLIC_URL || ''}/images/hero_thumb.png`;

/**
 * Boing Bot mascot — official assets from design system.
 * variant: 'default' | 'excited' | 'thinking' | 'winking'. Shows excited on bounce.
 */
export default function BoingMascot({ className = '', size = 160, variant = 'default' }) {
  const [bounce, setBounce] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = bounce ? MASCOTS.excited : (MASCOTS[variant] || MASCOTS.default);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
    img.src = MASCOTS.default;
    [MASCOTS.excited, MASCOTS.thinking, MASCOTS.winking].forEach((u) => { const i = new Image(); i.src = u; });
  }, []);

  const handleClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`boing-mascot-button cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl overflow-hidden transition-transform ${bounce ? 'scale-110' : 'hover:scale-105'} ${className}`}
      aria-label="Boing mascot - click to bounce"
    >
      <img
        src={loaded ? src : FALLBACK}
        alt=""
        width={size}
        height={size}
        className={`block w-full h-auto object-contain ${bounce ? 'animate-bounce' : 'boing-hero-float'}`}
        style={{
          width: size,
          height: 'auto',
          maxHeight: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 12px var(--glow-cyan-soft))',
        }}
      />
    </button>
  );
}
