import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LOGO_DARK = '/assets/logo-dark-transparent.png';
const LOGO_LIGHT = '/assets/logo-light-transparent.png';

/**
 * Logo: transparent PNG for dark/light mode with optional wordmark.
 * showComic=true uses the official "BOING!" comic-style asset from the design system.
 */
const Logo = ({ size = 40, className = "", showText = false, showComic = false }) => {
  const theme = useTheme();
  const logoSrc = theme?.mode === 'light' ? LOGO_LIGHT : LOGO_DARK;

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
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