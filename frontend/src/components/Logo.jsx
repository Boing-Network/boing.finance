import React, { useId } from 'react';

const base = process.env.PUBLIC_URL || '';

/**
 * Rebound medallion: custom rounded B, bounce-under trail, cyan orb.
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
      className="boing-logo-svg shrink-0 object-cover"
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={`${g}-disc`} cx="32%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#2a3a52" />
          <stop offset="48%" stopColor="#141c28" />
          <stop offset="100%" stopColor="#070a10" />
        </radialGradient>
        <linearGradient id={`${g}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ef6ff" />
          <stop offset="42%" stopColor="var(--primary-color)" />
          <stop offset="100%" stopColor="rgba(233,238,245,0.28)" />
        </linearGradient>
        <linearGradient id={`${g}-b`} x1="0%" y1="0%" x2="8%" y2="100%">
          <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.96" />
          <stop offset="38%" stopColor="color-mix(in srgb, var(--primary-color) 55%, #e9eef5)" />
          <stop offset="100%" stopColor="var(--primary-color)" />
        </linearGradient>
        <linearGradient id={`${g}-bounce`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="color-mix(in srgb, var(--primary-color) 22%, transparent)" />
          <stop offset="38%" stopColor="var(--primary-color)" />
          <stop offset="100%" stopColor="color-mix(in srgb, #e9eef5 55%, var(--primary-color))" />
        </linearGradient>
        <radialGradient id={`${g}-orb`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="color-mix(in srgb, var(--primary-color) 45%, #ffffff)" />
          <stop offset="100%" stopColor="var(--primary-color)" />
        </radialGradient>
        <filter id={`${g}-soft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.45" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${g}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="32" cy="32" r="30" fill={`url(#${g}-disc)`} />
      <circle
        cx="32"
        cy="32"
        r="29.15"
        fill="none"
        stroke={`url(#${g}-rim)`}
        strokeWidth="1.45"
      />
      <circle cx="32" cy="32" r="27.4" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
      <ellipse cx="23.5" cy="21.5" rx="13" ry="8.5" fill="rgba(255,255,255,0.05)" />

      <path
        d="M 10.8 36.6 C 15.2 50.2, 25.2 54.8, 32.2 48.8 C 37.8 44.0, 44.6 27.8, 52.6 14.8"
        fill="none"
        stroke={`url(#${g}-bounce)`}
        strokeWidth="1.75"
        strokeLinecap="round"
        filter={`url(#${g}-soft)`}
      />
      <circle
        cx="32.2"
        cy="48.8"
        r="1.2"
        fill="var(--primary-color)"
        opacity="0.9"
        filter={`url(#${g}-glow)`}
      />

      <path
        fill={`url(#${g}-b)`}
        fillRule="evenodd"
        d="M20.2 16.8H32.4C40.2 16.8 44.2 20.8 44.2 26.2C44.2 29.7 42.0 31.7 38.9 32.3C43.4 33.1 46.6 36.2 46.6 41.1C46.6 45.9 42.3 47.6 34.0 47.6H21.6L18.2 44.0V19.6C18.2 17.8 19.2 16.8 20.2 16.8ZM24.4 21.0V28.6H32.4C36.2 28.6 37.8 27.2 37.8 24.8C37.8 22.4 36.2 21.0 32.4 21.0H24.4ZM24.4 35.4V43.4H33.8C39.0 43.4 40.6 41.7 40.6 39.4C40.6 37.1 39.0 35.4 33.8 35.4H24.4Z"
      />

      <circle
        cx="52.6"
        cy="14.8"
        r="3.2"
        fill={`url(#${g}-orb)`}
        filter={`url(#${g}-glow)`}
      />
      <path
        fill="#f8fcff"
        d="M52.6 12.05 L53.25 14.15 L55.35 14.8 L53.25 15.45 L52.6 17.55 L51.95 15.45 L49.85 14.8 L51.95 14.15 Z"
      />
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
