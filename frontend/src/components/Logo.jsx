import React, { useId } from 'react';

const base = process.env.PUBLIC_URL || '';

/**
 * Boing family mark: rounded-square shell + recovery arc + orb.
 * Same bounce language as boing.network; square (not hex) so finance reads as its own site.
 * Keep path geometry in sync with public/assets/boing-logo-mark.svg (rasters / favicons).
 */
function BoingLogoMark({ size, title }) {
  const uid = useId().replace(/:/g, '');
  const g = `blm-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="boing-logo-svg shrink-0"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${g}-frame`} x1="8" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.5" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`${g}-orb`} x1="36" y1="14" x2="52" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" />
          <stop offset="0.55" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#67e8f9" />
        </linearGradient>
        <radialGradient id={`${g}-slab`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#1a2434" />
          <stop offset="100%" stopColor="#0c1018" />
        </radialGradient>
      </defs>
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="14"
        fill={`url(#${g}-slab)`}
        stroke={`url(#${g}-frame)`}
        strokeWidth="2.25"
      />
      <path
        d="M13 45 C 19 45 21 40 25 33 C 29 26 33 21 38 19 C 43 17 47 20 49 24"
        fill="none"
        stroke={`url(#${g}-frame)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="49" cy="24" r="7.25" fill={`url(#${g}-orb)`} />
      <circle
        cx="49"
        cy="24"
        r="7.25"
        fill="none"
        stroke={`url(#${g}-frame)`}
        strokeWidth="1.2"
        opacity="0.45"
      />
    </svg>
  );
}

/**
 * Logo: family rounded-square mark + Comfortaa wordmark.
 * showComic=true uses the official comic asset from the design system.
 */
const Logo = ({ size = 40, className = '', showText = false, showComic = false }) => {
  const title = 'Boing Finance';

  return (
    <div className={`flex items-center ${className}`}>
      <BoingLogoMark size={size} title={title} />
      {showText && !showComic && (
        <span className="logo-wordmark ml-2 text-xl font-semibold">
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
