import React from 'react';

/**
 * Logo: icon (logo.svg) with optional wordmark.
 * showComic=true uses the official "BOING!" comic-style asset from the design system.
 */
const Logo = ({ size = 40, className = "", showText = false, showComic = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo.svg"
        alt="Boing"
        width={size}
        height={size}
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
          src="/assets/logo-boing-comic.png"
          alt="BOING!"
          className="ml-2 h-6 md:h-7 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 6px var(--glow-cyan))' }}
        />
      )}
    </div>
  );
};

export default Logo; 