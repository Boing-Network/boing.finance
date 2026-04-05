import React from 'react';

const base = process.env.PUBLIC_URL || '';
/** Official circular Boing Finance mark (matches favicons / PWA / JSON-LD logo). */
const LOGO_MARK = `${base}/assets/boing-profile-twitter.png`;

/**
 * Logo: official profile mark with optional wordmark.
 * showComic=true uses the official "BOING!" comic-style asset from the design system.
 */
const Logo = ({ size = 40, className = '', showText = false, showComic = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={LOGO_MARK}
        alt="Boing Finance"
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{
          display: 'inline-block',
          filter: 'drop-shadow(0 0 8px var(--glow-cyan))',
        }}
      />
      {showText && !showComic && (
        <span className="ml-2 text-xl font-normal gradient-text">
          boing.finance
        </span>
      )}
      {showText && showComic && (
        <img
          src={`${base}/assets/logo-boing-comic.png`}
          alt="BOING!"
          className="ml-2 h-6 md:h-7 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 6px var(--glow-cyan))' }}
        />
      )}
    </div>
  );
};

export default Logo;
