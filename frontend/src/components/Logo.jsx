import React, { useId } from 'react';

const base = process.env.PUBLIC_URL || '';

/**
 * Vector mark aligned with the stone + soft-neon shell (Colosseum-style).
 * Replaces the legacy nebula PNG; still uses comic PNG when showComic.
 */
function BoingLogoMark({ size, title }) {
  const uid = useId().replace(/:/g, '');
  const g = `blm-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="boing-logo-svg shrink-0 object-cover"
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={`${g}-disc`} cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#1e2836" />
          <stop offset="45%" stopColor="#121a24" />
          <stop offset="100%" stopColor="#06080c" />
        </radialGradient>
        <linearGradient id={`${g}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="50%" stopColor="rgba(138,154,175,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <linearGradient id={`${g}-b`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.92" />
          <stop offset="42%" stopColor="var(--primary-color)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--primary-color) 38%, #1a2838)" />
        </linearGradient>
        <linearGradient id={`${g}-orbit`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="color-mix(in srgb, var(--primary-color) 25%, transparent)" />
          <stop offset="55%" stopColor="var(--primary-color)" />
          <stop offset="100%" stopColor="color-mix(in srgb, #c5d0e0 40%, var(--primary-color))" />
        </linearGradient>
        <filter id={`${g}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="32" cy="32" r="30" fill={`url(#${g}-disc)`} />
      <circle
        cx="32"
        cy="32"
        r="29.25"
        fill="none"
        stroke={`url(#${g}-rim)`}
        strokeWidth="0.85"
        opacity="0.9"
      />
      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />

      <path
        d="M 14 38 C 22 22, 38 14, 50 20"
        fill="none"
        stroke={`url(#${g}-orbit)`}
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.88"
        filter={`url(#${g}-soft)`}
      />
      <path
        d="M 49.2 19.4 L 50.6 21.8 L 53.2 22.2 L 51.1 24 L 51.6 26.8 L 49 25.5 L 46.4 26.8 L 47 24 L 44.8 22.2 L 47.4 21.8 Z"
        fill="#e9eef5"
        opacity="0.88"
      />

      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Orbitron, var(--font-display), system-ui, sans-serif"
        fontSize="29"
        fontWeight="700"
        fill={`url(#${g}-b)`}
        style={{ letterSpacing: '-0.04em' }}
      >
        B
      </text>
    </svg>
  );
}

/**
 * Logo: vector mark + optional wordmark.
 * showComic=true uses the official comic asset from the design system.
 */
const Logo = ({ size = 40, className = '', showText = false, showComic = false }) => {
  const title = 'Boing Finance';

  return (
    <div className={`flex items-center ${className}`}>
      <BoingLogoMark size={size} title={title} />
      {showText && !showComic && (
        <span className="logo-wordmark ml-2 text-xl font-normal">
          boing.finance
        </span>
      )}
      {showText && showComic && (
        <img
          src={`${base}/assets/logo-boing-comic.png`}
          alt="BOING!"
          className="ml-2 h-6 md:h-7 w-auto object-contain"
          style={{
            filter:
              'drop-shadow(0 0 8px color-mix(in srgb, var(--primary-color) 35%, transparent))',
          }}
        />
      )}
    </div>
  );
};

export default Logo;
