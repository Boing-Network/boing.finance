import React, { useState, useEffect } from 'react';

const IMAGES_BASE = `${process.env.PUBLIC_URL || ''}/images`;
const HERO_THUMB = `${IMAGES_BASE}/hero_thumb.png`;
const HERO_FALLBACK = `${IMAGES_BASE}/boing_robot_hero.png`;

/**
 * Boing hero robot + environment (from enhance_hero.py). Used as the mascot
 * with consistent float animation and click-to-bounce. Presence across the app.
 */
export default function BoingMascot({ className = '', size = 160 }) {
  const [bounce, setBounce] = useState(false);
  const [src, setSrc] = useState(HERO_THUMB);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setSrc(HERO_THUMB);
    img.onerror = () => setSrc(HERO_FALLBACK);
    img.src = HERO_THUMB;
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
      className={`boing-mascot-button cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#00E5CC] rounded-2xl overflow-hidden transition-transform ${bounce ? 'scale-110' : 'hover:scale-105'} ${className}`}
      aria-label="Boing mascot - click to bounce"
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`block w-full h-auto object-contain ${bounce ? 'animate-bounce' : 'boing-hero-float'}`}
        style={{
          width: size,
          height: 'auto',
          maxHeight: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 12px rgba(0, 229, 204, 0.25))',
        }}
      />
    </button>
  );
}
