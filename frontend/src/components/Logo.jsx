import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const base = process.env.PUBLIC_URL || '';
/** Dark / default UI: transparent nebula mark (navbar, footer). */
const LOGO_DARK = `${base}/assets/icon-only-transparent.png`;
/** Light theme: official sky / light-mode square mark. */
const LOGO_LIGHT = `${base}/assets/boing-logo-light-mode.png`;

/**
 * Logo: theme-aware Boing Finance mark with optional wordmark.
 * showComic=true uses the official "BOING!" comic-style asset from the design system.
 */
const Logo = ({ size = 40, className = '', showText = false, showComic = false }) => {
  const { isDarkMode } = useTheme();
  const logoSrc = isDarkMode ? LOGO_DARK : LOGO_LIGHT;

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Boing Finance logo: stylized 3D B with orbital star"
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
