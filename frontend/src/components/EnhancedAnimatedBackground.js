import React, { useState, useEffect } from 'react';

/**
 * Outerspace-oceanic theme: deep sea + cosmic, aligned with Boing Network
 * promotional video and brand (hexagonal grid, circuit lines, bioluminescent
 * teal/blue/purple, jellyfish-like orbs). Use for all official Boing sites/apps.
 */
const BOING_PRIMARY = '#00E5CC';   // Teal / bioluminescent
const BOING_SECONDARY = '#00B4FF'; // Electric blue
const DEEP_NAVY = '#0A0E1A';
const COSMIC_PURPLE = '#6366f1';   // Soft purple for cosmic depth
const GLOW_PINK = '#a78bfa';       // Jellyfish/coral accent

const BOING_BG_IMAGE = `${process.env.PUBLIC_URL || ''}/images/boing_background_dark.png`;

function EnhancedAnimatedBackground() {
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgImageLoaded(true);
    img.onerror = () => {}; // no image or 404 — use gradient + SVG only
    img.src = BOING_BG_IMAGE;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden w-full h-full">
      {/* Base: deep navy gradient (outerspace-oceanic depth) */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(180deg, #050810 0%, ${DEEP_NAVY} 25%, #0d1430 60%, ${DEEP_NAVY} 100%)`,
        }}
      />
      {/* Optional brand background — only shown when image exists (public/images/boing_background_dark.png) */}
      {bgImageLoaded && (
        <div
          className="absolute inset-0 w-full h-full opacity-40 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BOING_BG_IMAGE})` }}
          aria-hidden
        />
      )}

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
          {/* Hexagonal grid pattern - Boing network motif */}
          <pattern id="hexGrid" x="0" y="0" width="11.55" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M5.77 0 L11.55 3.33 L11.55 10 L5.77 13.33 L0 10 L0 3.33 Z"
              fill="none"
              stroke={BOING_PRIMARY}
              strokeWidth="0.08"
              opacity="0.12"
            />
            <path
              d="M5.77 6.67 L11.55 10 L11.55 16.67 L5.77 20 L0 16.67 L0 10 Z"
              fill="none"
              stroke={BOING_PRIMARY}
              strokeWidth="0.08"
              opacity="0.08"
            />
          </pattern>
          <radialGradient id="oceanGlow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BOING_PRIMARY} stopOpacity="0.08" />
            <stop offset="100%" stopColor={BOING_PRIMARY} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="oceanGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BOING_SECONDARY} stopOpacity="0.06" />
            <stop offset="100%" stopColor={BOING_SECONDARY} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cosmicGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={COSMIC_PURPLE} stopOpacity="0.06" />
            <stop offset="100%" stopColor={COSMIC_PURPLE} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hexagonal grid overlay */}
        <rect width="100" height="100" fill="url(#hexGrid)" />

        {/* Large ambient glows (oceanic / cosmic) */}
        <circle cx="25" cy="35" r="18" fill="url(#oceanGlow1)">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="20s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="65" r="22" fill="url(#oceanGlow2)">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="25s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="25" fill="url(#cosmicGlow)">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="30s" repeatCount="indefinite" />
        </circle>

        {/* Bioluminescent / jellyfish-like orbs - teal & blue */}
        <circle cx="20" cy="20" r="3.5" fill={BOING_PRIMARY} opacity="0.14">
          <animate attributeName="cy" values="20;24;20" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="82" cy="28" r="2.8" fill={BOING_SECONDARY} opacity="0.12">
          <animate attributeName="cy" values="28;32;28" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="38" cy="78" r="4" fill={BOING_PRIMARY} opacity="0.10">
          <animate attributeName="cy" values="78;82;78" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="15" r="2.2" fill={GLOW_PINK} opacity="0.09">
          <animate attributeName="cx" values="65;67;65" dur="11s" repeatCount="indefinite" />
          <animate attributeName="cy" values="15;17;15" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="52" r="2.5" fill={BOING_SECONDARY} opacity="0.11">
          <animate attributeName="cx" values="12;14;12" dur="12s" repeatCount="indefinite" />
          <animate attributeName="cy" values="52;50;52" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="88" cy="58" r="2.2" fill={BOING_PRIMARY} opacity="0.10">
          <animate attributeName="cx" values="88;86;88" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cy" values="58;60;58" dur="9s" repeatCount="indefinite" />
        </circle>

        {/* Smaller floating orbs (plankton / stars) */}
        <circle cx="55" cy="12" r="1.8" fill={BOING_PRIMARY} opacity="0.08">
          <animate attributeName="cx" values="55;56;55" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="58" r="2" fill={BOING_SECONDARY} opacity="0.09">
          <animate attributeName="cy" values="58;56;58" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="78" cy="72" r="1.2" fill={COSMIC_PURPLE} opacity="0.07">
          <animate attributeName="cx" values="78;79;78" dur="11s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="38" r="1.5" fill={GLOW_PINK} opacity="0.08">
          <animate attributeName="cx" values="8;9;8" dur="13s" repeatCount="indefinite" />
          <animate attributeName="cy" values="38;40;38" dur="11s" repeatCount="indefinite" />
        </circle>
        <circle cx="92" cy="22" r="1.8" fill={BOING_PRIMARY} opacity="0.07">
          <animate attributeName="cx" values="92;91;92" dur="14s" repeatCount="indefinite" />
          <animate attributeName="cy" values="22;20;22" dur="12s" repeatCount="indefinite" />
        </circle>

        {/* Twinkling stars / bioluminescent specks */}
        <circle cx="24" cy="10" r="0.12" fill="#fff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="54" cy="20" r="0.1" fill={BOING_PRIMARY}>
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="84" cy="52" r="0.12" fill={BOING_SECONDARY}>
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="42" cy="16" r="0.11" fill={GLOW_PINK}>
          <animate attributeName="opacity" values="0.1;0.8;0.1" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="68" cy="44" r="0.08" fill={BOING_PRIMARY}>
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
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

        {/* Floating particles (rising bubbles / drifting plankton) */}
        <circle cx="34" cy="28" r="0.18" fill={BOING_PRIMARY} opacity="0.35">
          <animate attributeName="cy" values="28;24;28" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="58" cy="54" r="0.12" fill={BOING_SECONDARY} opacity="0.28">
          <animate attributeName="cx" values="58;60;58" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0.05;0.28" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="88" r="0.15" fill={BOING_PRIMARY} opacity="0.3">
          <animate attributeName="cy" values="88;84;88" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.06;0.3" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="78" cy="44" r="0.11" fill={BOING_PRIMARY} opacity="0.22">
          <animate attributeName="cx" values="78;76;78" dur="8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="44;46;44" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.22;0.06;0.22" dur="8s" repeatCount="indefinite" />
        </circle>

        {/* Circuit-line accents (network / tech motif) */}
        <line x1="5" y1="22" x2="12" y2="22" stroke={BOING_PRIMARY} strokeWidth="0.06" opacity="0.15">
          <animate attributeName="x1" values="5;6;5" dur="14s" repeatCount="indefinite" />
          <animate attributeName="x2" values="12;13;12" dur="14s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="14s" repeatCount="indefinite" />
        </line>
        <line x1="82" y1="78" x2="88" y2="78" stroke={BOING_SECONDARY} strokeWidth="0.06" opacity="0.12">
          <animate attributeName="x1" values="82;81;82" dur="16s" repeatCount="indefinite" />
          <animate attributeName="x2" values="88;87;88" dur="16s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.28;0.12" dur="16s" repeatCount="indefinite" />
        </line>
        <line x1="2" y1="88" x2="9" y2="80" stroke={BOING_PRIMARY} strokeWidth="0.05" opacity="0.1">
          <animate attributeName="opacity" values="0.1;0.25;0.1" dur="15s" repeatCount="indefinite" />
        </line>

        {/* Soft wave (ocean current) */}
        <path
          d="M0,52 Q18,48 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z"
          fill={BOING_PRIMARY}
          opacity="0.04"
        >
          <animate
            attributeName="d"
            values="M0,52 Q18,48 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z;
                    M0,52 Q18,56 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z;
                    M0,52 Q18,48 38,52 T78,52 T118,52 T100,52 L100,100 L0,100 Z"
            dur="18s"
            repeatCount="indefinite"
          />
        </path>

        {/* Pulsing glows */}
        <circle cx="68" cy="44" r="1" fill={BOING_PRIMARY} opacity="0.05">
          <animate attributeName="r" values="1;1.6;1" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.05;0.14;0.05" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="48" r="0.85" fill={BOING_SECONDARY} opacity="0.06">
          <animate attributeName="r" values="0.85;1.35;0.85" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.12;0.06" dur="10s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export default EnhancedAnimatedBackground;
