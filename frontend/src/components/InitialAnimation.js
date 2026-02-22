import React, { useState, useEffect, useCallback, useId } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const SESSION_KEY = 'boing-splash-seen';
const DURATION_MS = 3200;
const DURATION_REDUCED_MS = 1200;

const ASSETS = `${process.env.PUBLIC_URL || ''}/assets`;
const MASCOT_SRC = `${ASSETS}/mascot-default.png`;
const MASCOT_FALLBACK = `${ASSETS}/mascot-winking.png`;

/**
 * Full-viewport initial animation: Boing Mascot centered with aquatic & outer-space
 * theme elements orbiting around. Shown once per session; respects reduced motion.
 */
function InitialAnimation({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [mascotSrc, setMascotSrc] = useState(MASCOT_SRC);
  const { mode } = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const duration = prefersReducedMotion ? DURATION_REDUCED_MS : DURATION_MS;

  const finish = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_) {}
    // Cinematic outro: content recedes, then overlay fades (OUTRO_MS total) before unmount
    const OUTRO_MS = prefersReducedMotion ? 500 : 1100;
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, OUTRO_MS);
    return () => clearTimeout(t);
  }, [onComplete, exiting, prefersReducedMotion]);

  useEffect(() => {
    const t = setTimeout(finish, duration);
    return () => clearTimeout(t);
  }, [duration, finish]);

  const handleClick = () => finish();

  if (!visible) return null;

  const reduced = prefersReducedMotion;

  return (
    <div
      className="initial-animation"
      data-reduced={reduced ? 'true' : undefined}
      data-exiting={exiting ? 'true' : undefined}
      data-intro={!exiting ? 'true' : undefined}
      data-theme={mode}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
    >
      <style>{getStyles()}</style>
      <div className="initial-animation__bg" aria-hidden />
      <div className="initial-animation__content">
        <div className="initial-animation__orbit-zone">
          {/* Inner orbit: bubbles (aquatic) — one rotating ring, orbs at top */}
          <div className="initial-animation__orbit initial-animation__orbit--inner">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div key={deg} className="initial-animation__orbit-seed" style={{ transform: `rotate(${deg}deg)` }}>
                <div className="initial-animation__orbit-spin">
                  <div className="initial-animation__orb initial-animation__orb--bubble">
                    <span className="initial-animation__bubble" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Middle orbit: stars (outer-space) */}
          <div className="initial-animation__orbit initial-animation__orbit--middle">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div key={deg} className="initial-animation__orbit-seed" style={{ transform: `rotate(${deg}deg)` }}>
                <div className="initial-animation__orbit-spin">
                  <div className="initial-animation__orb initial-animation__orb--star">
                    <StarIcon />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Outer orbit: planets + jellyfish (aquatic + space) */}
          <div className="initial-animation__orbit initial-animation__orbit--outer">
            {[0, 72, 144, 216, 288].map((deg) => (
              <div key={`p-${deg}`} className="initial-animation__orbit-seed" style={{ transform: `rotate(${deg}deg)` }}>
                <div className="initial-animation__orbit-spin">
                  <div className="initial-animation__orb initial-animation__orb--planet">
                    <span className="initial-animation__planet" />
                  </div>
                </div>
              </div>
            ))}
            {[36, 108, 180, 252, 324].map((deg) => (
              <div key={`j-${deg}`} className="initial-animation__orbit-seed" style={{ transform: `rotate(${deg}deg)` }}>
                <div className="initial-animation__orbit-spin">
                  <div className="initial-animation__orb initial-animation__orb--jelly">
                    <JellyIcon />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Center: Boing Mascot (transparent PNG from assets) */}
          <div className="initial-animation__mascot">
            <img
              src={mascotSrc}
              alt=""
              width={200}
              height={200}
              className="initial-animation__mascot-img"
              onError={() => setMascotSrc(MASCOT_FALLBACK)}
            />
          </div>
        </div>
        <p className="initial-animation__hint">Click or wait to continue</p>
      </div>
    </div>
  );
}

function StarIcon() {
  const id = useId().replace(/:/g, '-');
  return (
    <svg className="initial-animation__star-svg" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`splash-star-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--finance-primary)" />
          <stop offset="100%" stopColor="var(--finance-green)" />
        </linearGradient>
      </defs>
      <path d="M12 2l1.5 6.5L20 10l-5.5 1.5L12 18l-2.5-6.5L4 10l6.5-1.5L12 2z" fill={`url(#splash-star-grad-${id})`} stroke="var(--finance-primary)" strokeWidth="0.5" strokeOpacity="0.6" />
    </svg>
  );
}

function JellyIcon() {
  return (
    <svg className="initial-animation__jelly-svg" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="10" rx="6" ry="5" fill="var(--accent-teal)" fillOpacity="0.5" stroke="var(--finance-primary)" strokeWidth="0.8" strokeOpacity="0.7" />
      <path d="M8 14 Q12 18 16 14" stroke="var(--finance-primary)" strokeWidth="0.6" strokeOpacity="0.6" fill="none" />
    </svg>
  );
}

function getStyles() {
  return `
    .initial-animation {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.6s ease;
    }
    .initial-animation[data-exiting="true"] {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition-duration: 1s;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    .initial-animation__bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, #020408 0%, #030810 45%, #040c18 100%);
      opacity: 0.98;
    }
    .initial-animation[data-intro="true"] .initial-animation__bg {
      animation: initial-bg-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes initial-bg-in {
      from { opacity: 0; }
      to { opacity: 0.98; }
    }
    .initial-animation[data-theme="light"] .initial-animation__bg {
      background: linear-gradient(180deg, #030810 0%, #051220 45%, #061828 100%);
    }
    .initial-animation__content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.92);
    }
    .initial-animation[data-intro="true"] .initial-animation__content {
      animation: initial-content-in 1s cubic-bezier(0.22, 1, 0.36, 1) 0.25s forwards;
    }
    .initial-animation[data-reduced="true"] .initial-animation__content {
      animation-duration: 0.5s;
      animation-delay: 0.1s;
    }
    .initial-animation[data-exiting="true"] .initial-animation__content {
      animation: initial-content-out 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes initial-content-in {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes initial-content-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.96); }
    }
    .initial-animation__orbit-zone {
      position: relative;
      width: min(90vmin, 520px);
      height: min(90vmin, 520px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .initial-animation__orbit {
      position: absolute;
      border-radius: 50%;
      width: 100%;
      height: 100%;
    }
    .initial-animation__orbit--inner { width: 55%; height: 55%; }
    .initial-animation__orbit--middle { width: 75%; height: 75%; }
    .initial-animation__orbit--outer { width: 100%; height: 100%; }
    .initial-animation__orbit-seed {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }
    .initial-animation__orbit-spin {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      animation: initial-orbit-spin linear infinite;
    }
    .initial-animation__orbit--inner .initial-animation__orbit-spin {
      animation-duration: 22s;
      animation-direction: reverse;
    }
    .initial-animation__orbit--middle .initial-animation__orbit-spin {
      animation-duration: 28s;
    }
    .initial-animation__orbit--outer .initial-animation__orbit-spin {
      animation-duration: 38s;
      animation-direction: reverse;
    }
    .initial-animation[data-reduced="true"] .initial-animation__orbit-spin {
      animation-duration: 0.001s;
      animation-play-state: paused;
    }
    @keyframes initial-orbit-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .initial-animation__orb {
      position: absolute;
      left: 50%;
      top: 0;
      width: 24px;
      height: 24px;
      margin-left: -12px;
      margin-top: -12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .initial-animation__orb--bubble {
      width: 14px;
      height: 14px;
      margin-left: -7px;
      margin-top: -7px;
    }
    .initial-animation__bubble {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), var(--finance-primary));
      box-shadow: 0 0 10px var(--glow-cyan-soft);
      opacity: 0.85;
      animation: initial-bubble-pulse 2.5s ease-in-out infinite;
    }
    .initial-animation__orb--star {
      width: 20px;
      height: 20px;
      margin-left: -10px;
      margin-top: -10px;
    }
    .initial-animation__star-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 6px var(--glow-cyan-soft));
    }
    .initial-animation__orb--planet {
      width: 18px;
      height: 18px;
      margin-left: -9px;
      margin-top: -9px;
    }
    .initial-animation__planet {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, var(--finance-green), var(--finance-primary));
      box-shadow: 0 0 12px var(--finance-purple-glow);
      opacity: 0.7;
    }
    .initial-animation__orb--jelly {
      width: 22px;
      height: 22px;
      margin-left: -11px;
      margin-top: -11px;
    }
    .initial-animation__jelly-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 8px var(--glow-cyan-soft));
    }
    @keyframes initial-bubble-pulse {
      0%, 100% { transform: scale(1); opacity: 0.85; }
      50% { transform: scale(1.15); opacity: 1; }
    }
    .initial-animation__mascot {
      position: relative;
      z-index: 5;
    }
    .initial-animation__mascot-img {
      display: block;
      width: 200px;
      height: auto;
      max-height: 200px;
      min-height: 200px;
      object-fit: contain;
      filter: drop-shadow(0 0 20px var(--glow-cyan-soft)) drop-shadow(0 0 40px var(--glow-cyan));
      animation: initial-mascot-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
      opacity: 0;
      transform: scale(0.88);
    }
    .initial-animation[data-reduced="true"] .initial-animation__mascot-img {
      animation-duration: 0.35s;
      animation-delay: 0.2s;
    }
    @keyframes initial-mascot-in {
      to { opacity: 1; transform: scale(1); }
    }
    .initial-animation__hint {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.6;
      color: var(--text-secondary);
      animation: initial-hint-fade 0.8s 0.6s ease-out forwards;
      opacity: 0;
    }
    @keyframes initial-hint-fade {
      to { opacity: 0.6; }
    }
  `;
}

export default InitialAnimation;

/** Check if we should show the splash this session (call once at app init). */
export function shouldShowInitialAnimation() {
  if (typeof sessionStorage === 'undefined') return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}
