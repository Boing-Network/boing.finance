import React, { useState, useEffect } from 'react';
import HeroElementsLayer from './HeroElementsLayer';

/**
 * Outerspace-oceanic theme: deep sea + cosmic. Subtle hex grid, animated
 * jellyfish & fish, bioluminescent orbs. Uses modified background PNG when
 * present; overlays extracted hero elements with 3D motion.
 */
const BOING_PRIMARY = '#00E5CC';
const BOING_SECONDARY = '#00B4FF';
const DEEP_NAVY = '#0A0E1A';
const COSMIC_PURPLE = '#6366f1';
const GLOW_PINK = '#a78bfa';

const BASE = process.env.PUBLIC_URL || '';
const BOING_BG_IMAGE = `${BASE}/images/boing_background_dark.png`;
const BOING_BG_MODIFIED = `${BASE}/images/boing_background_dark_modified.png`;

function EnhancedAnimatedBackground() {
  const [bgImageUrl, setBgImageUrl] = useState(BOING_BG_IMAGE);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  useEffect(() => {
    const modified = new Image();
    modified.onload = () => {
      setBgImageUrl(BOING_BG_MODIFIED);
      setBgImageLoaded(true);
    };
    modified.onerror = () => {
      setBgImageUrl(BOING_BG_IMAGE);
      const fallback = new Image();
      fallback.onload = () => setBgImageLoaded(true);
      fallback.onerror = () => setBgImageLoaded(false);
      fallback.src = BOING_BG_IMAGE;
    };
    modified.src = BOING_BG_MODIFIED;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden w-full h-full">
      {/* Base: deep navy gradient */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(180deg, #050810 0%, ${DEEP_NAVY} 25%, #0d1430 60%, ${DEEP_NAVY} 100%)`,
        }}
      />
      {bgImageLoaded && (
        <div
          className="absolute inset-0 w-full h-full opacity-40 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImageUrl})` }}
          aria-hidden
        />
      )}
      <HeroElementsLayer />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full min-w-full min-h-full"
      >
        <defs>
          {/* Very subtle hex grid — low opacity so it doesn’t compete with content */}
          <pattern id="hexGrid" x="0" y="0" width="11.55" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M5.77 0 L11.55 3.33 L11.55 10 L5.77 13.33 L0 10 L0 3.33 Z"
              fill="none"
              stroke={BOING_PRIMARY}
              strokeWidth="0.04"
              opacity="0.035"
            />
            <path
              d="M5.77 6.67 L11.55 10 L11.55 16.67 L5.77 20 L0 16.67 L0 10 Z"
              fill="none"
              stroke={BOING_PRIMARY}
              strokeWidth="0.04"
              opacity="0.02"
            />
          </pattern>
          <radialGradient id="oceanGlow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BOING_PRIMARY} stopOpacity="0.06" />
            <stop offset="100%" stopColor={BOING_PRIMARY} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="oceanGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BOING_SECONDARY} stopOpacity="0.05" />
            <stop offset="100%" stopColor={BOING_SECONDARY} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cosmicGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COSMIC_PURPLE} stopOpacity="0.04" />
            <stop offset="100%" stopColor={COSMIC_PURPLE} stopOpacity="0" />
          </radialGradient>
          {/* Jellyfish gradient — translucent bell */}
          <radialGradient id="jellyGrad1" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={BOING_PRIMARY} stopOpacity="0.35" />
            <stop offset="70%" stopColor={BOING_SECONDARY} stopOpacity="0.15" />
            <stop offset="100%" stopColor={BOING_PRIMARY} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="jellyGrad2" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={GLOW_PINK} stopOpacity="0.3" />
            <stop offset="70%" stopColor={COSMIC_PURPLE} stopOpacity="0.12" />
            <stop offset="100%" stopColor={GLOW_PINK} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="jellyGrad3" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={BOING_SECONDARY} stopOpacity="0.3" />
            <stop offset="70%" stopColor={BOING_PRIMARY} stopOpacity="0.12" />
            <stop offset="100%" stopColor={BOING_SECONDARY} stopOpacity="0" />
          </radialGradient>
          {/* Soft glow filter for creatures */}
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint hex grid — background only */}
        <rect width="100" height="100" fill="url(#hexGrid)" />

        {/* Ambient glows */}
        <circle cx="25" cy="35" r="18" fill="url(#oceanGlow1)">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="20s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="65" r="22" fill="url(#oceanGlow2)">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="25s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="25" fill="url(#cosmicGlow)">
          <animate attributeName="opacity" values="0.2;0.45;0.2" dur="30s" repeatCount="indefinite" />
        </circle>

        {/* ——— Jellyfish (floating, gentle sway) ——— */}
        <g id="jelly1" filter="url(#softGlow)" opacity="0.85">
          <ellipse cx="18" cy="22" rx="2.8" ry="1.8" fill="url(#jellyGrad1)">
            <animate attributeName="cy" values="22;26;22" dur="5s" repeatCount="indefinite" />
            <animate attributeName="rx" values="2.8;3;2.8" dur="3s" repeatCount="indefinite" />
          </ellipse>
          <path d="M15.5 23.5 Q15 28 16 32 Q16.5 35 15.5 38" stroke={BOING_PRIMARY} strokeWidth="0.08" fill="none" opacity="0.5" strokeLinecap="round">
            <animate attributeName="d" values="M15.5 23.5 Q15 28 16 32 Q16.5 35 15.5 38;M15.5 23.5 Q16 28 15 32 Q14.5 35 15.5 38;M15.5 23.5 Q15 28 16 32 Q16.5 35 15.5 38" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M18 23.8 Q18 30 18 36" stroke={BOING_PRIMARY} strokeWidth="0.06" fill="none" opacity="0.45" strokeLinecap="round">
            <animate attributeName="opacity" values="0.45;0.25;0.45" dur="2.5s" repeatCount="indefinite" />
          </path>
          <path d="M20.5 23.5 Q21 28 20 32 Q19.5 35 20.5 38" stroke={BOING_PRIMARY} strokeWidth="0.08" fill="none" opacity="0.5" strokeLinecap="round">
            <animate attributeName="d" values="M20.5 23.5 Q21 28 20 32 Q19.5 35 20.5 38;M20.5 23.5 Q20 28 21 32 Q21.5 35 20.5 38;M20.5 23.5 Q21 28 20 32 Q19.5 35 20.5 38" dur="4.2s" repeatCount="indefinite" />
          </path>
        </g>
        <g id="jelly2" filter="url(#softGlow)" opacity="0.75">
          <ellipse cx="78" cy="18" rx="2.2" ry="1.4" fill="url(#jellyGrad2)">
            <animate attributeName="cy" values="18;22;18" dur="6s" repeatCount="indefinite" />
            <animate attributeName="cx" values="78;79;78" dur="8s" repeatCount="indefinite" />
          </ellipse>
          <path d="M76.2 19.2 Q76 24 77 28 Q77.5 30 76.5 33" stroke={GLOW_PINK} strokeWidth="0.06" fill="none" opacity="0.45" strokeLinecap="round">
            <animate attributeName="d" values="M76.2 19.2 Q76 24 77 28 Q77.5 30 76.5 33;M76.2 19.2 Q77 24 76 28 Q75.5 30 76.5 33;M76.2 19.2 Q76 24 77 28 Q77.5 30 76.5 33" dur="3.5s" repeatCount="indefinite" />
          </path>
          <path d="M78 19.6 L78 26" stroke={GLOW_PINK} strokeWidth="0.05" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M79.8 19.2 Q80 24 79 28 Q78.5 30 79.5 33" stroke={GLOW_PINK} strokeWidth="0.06" fill="none" opacity="0.45" strokeLinecap="round">
            <animate attributeName="d" values="M79.8 19.2 Q80 24 79 28 Q78.5 30 79.5 33;M79.8 19.2 Q79 24 80 28 Q80.5 30 79.5 33;M79.8 19.2 Q80 24 79 28 Q78.5 30 79.5 33" dur="3.8s" repeatCount="indefinite" />
          </path>
        </g>
        <g id="jelly3" filter="url(#softGlow)" opacity="0.7">
          <ellipse cx="85" cy="72" rx="2.5" ry="1.6" fill="url(#jellyGrad3)">
            <animate attributeName="cy" values="72;76;72" dur="7s" repeatCount="indefinite" />
            <animate attributeName="cx" values="85;84;85" dur="9s" repeatCount="indefinite" />
          </ellipse>
          <path d="M83 73.4 Q82.5 78 83.5 82 Q84 85 83 88" stroke={BOING_SECONDARY} strokeWidth="0.07" fill="none" opacity="0.45" strokeLinecap="round">
            <animate attributeName="d" values="M83 73.4 Q82.5 78 83.5 82 Q84 85 83 88;M83 73.4 Q83.5 78 82.5 82 Q82 85 83 88;M83 73.4 Q82.5 78 83.5 82 Q84 85 83 88" dur="4.5s" repeatCount="indefinite" />
          </path>
          <path d="M85 73.8 L85 80" stroke={BOING_SECONDARY} strokeWidth="0.05" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M87 73.4 Q87.5 78 86.5 82 Q86 85 87 88" stroke={BOING_SECONDARY} strokeWidth="0.07" fill="none" opacity="0.45" strokeLinecap="round">
            <animate attributeName="d" values="M87 73.4 Q87.5 78 86.5 82 Q86 85 87 88;M87 73.4 Q86.5 78 87.5 82 Q88 85 87 88;M87 73.4 Q87.5 78 86.5 82 Q86 85 87 88" dur="4.8s" repeatCount="indefinite" />
          </path>
        </g>
        <g id="jelly4" filter="url(#softGlow)" opacity="0.65">
          <ellipse cx="12" cy="58" rx="2" ry="1.3" fill="url(#jellyGrad1)">
            <animate attributeName="cy" values="58;62;58" dur="5.5s" repeatCount="indefinite" />
            <animate attributeName="cx" values="12;11;12" dur="7s" repeatCount="indefinite" />
          </ellipse>
          <path d="M10.2 59.2 Q10 63 11 67 Q11.5 69 10.5 72" stroke={BOING_PRIMARY} strokeWidth="0.06" fill="none" opacity="0.4" strokeLinecap="round">
            <animate attributeName="d" values="M10.2 59.2 Q10 63 11 67 Q11.5 69 10.5 72;M10.2 59.2 Q11 63 10 67 Q9.5 69 10.5 72;M10.2 59.2 Q10 63 11 67 Q11.5 69 10.5 72" dur="3.2s" repeatCount="indefinite" />
          </path>
          <path d="M12 59.6 L12 65" stroke={BOING_PRIMARY} strokeWidth="0.05" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M13.8 59.2 Q14 63 13 67 Q12.5 69 13.5 72" stroke={BOING_PRIMARY} strokeWidth="0.06" fill="none" opacity="0.4" strokeLinecap="round">
            <animate attributeName="d" values="M13.8 59.2 Q14 63 13 67 Q12.5 69 13.5 72;M13.8 59.2 Q13 63 14 67 Q14.5 69 13.5 72;M13.8 59.2 Q14 63 13 67 Q12.5 69 13.5 72" dur="3.5s" repeatCount="indefinite" />
          </path>
        </g>
        <g id="jelly5" filter="url(#softGlow)" opacity="0.6">
          <ellipse cx="52" cy="82" rx="2.4" ry="1.5" fill="url(#jellyGrad2)">
            <animate attributeName="cy" values="82;86;82" dur="6.5s" repeatCount="indefinite" />
            <animate attributeName="cx" values="52;53;52" dur="8s" repeatCount="indefinite" />
          </ellipse>
          <path d="M49.8 83.4 Q49.5 87 50.5 91 Q51 93 50 96" stroke={GLOW_PINK} strokeWidth="0.06" fill="none" opacity="0.4" strokeLinecap="round">
            <animate attributeName="d" values="M49.8 83.4 Q49.5 87 50.5 91 Q51 93 50 96;M49.8 83.4 Q50.5 87 49.5 91 Q49 93 50 96;M49.8 83.4 Q49.5 87 50.5 91 Q51 93 50 96" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M52 83.8 L52 89" stroke={GLOW_PINK} strokeWidth="0.05" fill="none" opacity="0.35" strokeLinecap="round" />
          <path d="M54.2 83.4 Q54.5 87 53.5 91 Q53 93 54 96" stroke={GLOW_PINK} strokeWidth="0.06" fill="none" opacity="0.4" strokeLinecap="round">
            <animate attributeName="d" values="M54.2 83.4 Q54.5 87 53.5 91 Q53 93 54 96;M54.2 83.4 Q53.5 87 54.5 91 Q55 93 54 96;M54.2 83.4 Q54.5 87 53.5 91 Q53 93 54 96" dur="4.2s" repeatCount="indefinite" />
          </path>
        </g>

        {/* ——— Fish (slow drift; whole group translated) ——— */}
        <g id="fish1" opacity="0.5">
          <animateTransform attributeName="transform" type="translate" values="8,35; 92,35; 8,35" dur="45s" repeatCount="indefinite" />
          <ellipse cx="0" cy="0" rx="1.8" ry="0.9" fill={BOING_PRIMARY}>
            <animate attributeName="cy" values="0;1;-1;0" dur="12s" repeatCount="indefinite" />
          </ellipse>
          <path d="M1.6 0 L3 -0.8 L3 0.8 Z" fill={BOING_PRIMARY} />
        </g>
        <g id="fish2" opacity="0.45">
          <animateTransform attributeName="transform" type="translate" values="95,48; 3,48; 95,48" dur="55s" repeatCount="indefinite" />
          <ellipse cx="0" cy="0" rx="1.4" ry="0.7" fill={BOING_SECONDARY}>
            <animate attributeName="cy" values="0;-1;1;0" dur="10s" repeatCount="indefinite" />
          </ellipse>
          <path d="M-1.4 0 L-2.8 -0.7 L-2.8 0.7 Z" fill={BOING_SECONDARY} />
        </g>
        <g id="fish3" opacity="0.4">
          <animateTransform attributeName="transform" type="translate" values="5,78; 98,78; 5,78" dur="50s" repeatCount="indefinite" />
          <ellipse cx="0" cy="0" rx="1.2" ry="0.6" fill={GLOW_PINK}>
            <animate attributeName="cy" values="0;1;-1;0" dur="14s" repeatCount="indefinite" />
          </ellipse>
          <path d="M1.1 0 L2.2 -0.5 L2.2 0.5 Z" fill={GLOW_PINK} />
        </g>
        <g id="fish4" opacity="0.35">
          <animateTransform attributeName="transform" type="translate" values="88,12; 10,12; 88,12" dur="60s" repeatCount="indefinite" />
          <ellipse cx="0" cy="0" rx="1" ry="0.5" fill={BOING_PRIMARY}>
            <animate attributeName="cy" values="0;1;-1;0" dur="9s" repeatCount="indefinite" />
          </ellipse>
          <path d="M0.9 0 L1.8 -0.4 L1.8 0.4 Z" fill={BOING_PRIMARY} />
        </g>

        {/* Bioluminescent orbs (softer) */}
        <circle cx="20" cy="20" r="3.5" fill={BOING_PRIMARY} opacity="0.1">
          <animate attributeName="cy" values="20;24;20" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="82" cy="28" r="2.8" fill={BOING_SECONDARY} opacity="0.09">
          <animate attributeName="cy" values="28;32;28" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="38" cy="78" r="4" fill={BOING_PRIMARY} opacity="0.07">
          <animate attributeName="cy" values="78;82;78" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="15" r="2.2" fill={GLOW_PINK} opacity="0.06">
          <animate attributeName="cx" values="65;67;65" dur="11s" repeatCount="indefinite" />
          <animate attributeName="cy" values="15;17;15" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="88" cy="58" r="2.2" fill={BOING_PRIMARY} opacity="0.07">
          <animate attributeName="cx" values="88;86;88" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cy" values="58;60;58" dur="9s" repeatCount="indefinite" />
        </circle>

        {/* Twinkling specks */}
        <circle cx="24" cy="10" r="0.12" fill="#fff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="54" cy="20" r="0.1" fill={BOING_PRIMARY}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="84" cy="52" r="0.12" fill={BOING_SECONDARY}>
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="68" r="0.09" fill={BOING_SECONDARY}>
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="72" cy="88" r="0.11" fill={BOING_PRIMARY}>
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.9s" repeatCount="indefinite" />
        </circle>
        <circle cx="6" cy="84" r="0.07" fill={COSMIC_PURPLE}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {/* Floating particles */}
        <circle cx="34" cy="28" r="0.18" fill={BOING_PRIMARY} opacity="0.28">
          <animate attributeName="cy" values="28;24;28" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0.06;0.28" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="58" cy="54" r="0.12" fill={BOING_SECONDARY} opacity="0.22">
          <animate attributeName="cx" values="58;60;58" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.22;0.04;0.22" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="88" r="0.15" fill={BOING_PRIMARY} opacity="0.24">
          <animate attributeName="cy" values="88;84;88" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.24;0.05;0.24" dur="6s" repeatCount="indefinite" />
        </circle>

        {/* Very subtle wave */}
        <path d="M0,52 Q18,48 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z" fill={BOING_PRIMARY} opacity="0.03">
          <animate
            attributeName="d"
            values="M0,52 Q18,48 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z;M0,52 Q18,56 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z;M0,52 Q18,48 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z"
            dur="18s"
            repeatCount="indefinite"
          />
        </path>

        {/* Pulsing glows (subtle) */}
        <circle cx="68" cy="44" r="1" fill={BOING_PRIMARY} opacity="0.04">
          <animate attributeName="r" values="1;1.5;1" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.04;0.1;0.04" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="48" r="0.85" fill={BOING_SECONDARY} opacity="0.04">
          <animate attributeName="r" values="0.85;1.2;0.85" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.04;0.09;0.04" dur="10s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export default EnhancedAnimatedBackground;
