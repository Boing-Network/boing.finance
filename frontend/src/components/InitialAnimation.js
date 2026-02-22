import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const SESSION_KEY = 'boing-splash-seen';
const DURATION_MS = 4200;
const DURATION_REDUCED_MS = 1800;

const ASSETS = `${process.env.PUBLIC_URL || ''}/assets`;
const MASCOT_SRC = `${ASSETS}/mascot-default.png`;
const MASCOT_FALLBACK = `${ASSETS}/mascot-winking.png`;

/**
 * Cinematic 3D initial animation: portal reveal with mascot emerging,
 * then eases into the web app. Unique, branded intro.
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
    const OUTRO_MS = prefersReducedMotion ? 600 : 1400;
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
      className="cinematic-splash"
      data-reduced={reduced ? 'true' : undefined}
      data-exiting={exiting ? 'true' : undefined}
      data-theme={mode}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
    >
      <style>{getCinematicStyles()}</style>
      {/* Layer 1: Black → gradient base */}
      <div className="cinematic-splash__bg" aria-hidden />
      {/* Layer 2: Subtle starfield / depth */}
      <div className="cinematic-splash__stars" aria-hidden />
      {/* Layer 3: 3D scene container */}
      <div className="cinematic-splash__scene">
        <div className="cinematic-splash__portal-wrap">
          {/* Glowing portal ring (3D rotated) */}
          <div className="cinematic-splash__portal">
            <div className="cinematic-splash__portal-ring cinematic-splash__portal-ring--outer" />
            <div className="cinematic-splash__portal-ring cinematic-splash__portal-ring--mid" />
            <div className="cinematic-splash__portal-ring cinematic-splash__portal-ring--inner" />
          </div>
          {/* Mascot emerges from center */}
          <div className="cinematic-splash__mascot-wrap">
            <img
              src={mascotSrc}
              alt=""
              width={220}
              height={220}
              className="cinematic-splash__mascot-img"
              onError={() => setMascotSrc(MASCOT_FALLBACK)}
            />
          </div>
        </div>
        {/* Light rays / lens flare accent */}
        <div className="cinematic-splash__rays" aria-hidden />
      </div>
      <p className="cinematic-splash__hint">Click or wait to continue</p>
    </div>
  );
}

function getCinematicStyles() {
  return `
    .cinematic-splash {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: #000;
      transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 1.3s ease;
    }
    .cinematic-splash[data-exiting="true"] {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition-duration: 1.4s;
    }
    .cinematic-splash__bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 50% 40%, #030a14 0%, #020408 45%, #000 100%);
      opacity: 0;
      animation: cinematic-bg-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards;
    }
    .cinematic-splash[data-theme="light"] .cinematic-splash__bg {
      background: radial-gradient(ellipse 80% 60% at 50% 40%, #051220 0%, #030810 50%, #020408 100%);
    }
    @keyframes cinematic-bg-in {
      to { opacity: 1; }
    }
    .cinematic-splash__stars {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(1.5px 1.5px at 20% 30%, rgba(0,229,255,0.4), transparent),
        radial-gradient(1.5px 1.5px at 60% 70%, rgba(0,255,136,0.3), transparent),
        radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.35), transparent),
        radial-gradient(1px 1px at 40% 80%, rgba(0,229,255,0.25), transparent);
      background-size: 200% 200%;
      opacity: 0;
      animation: cinematic-stars-in 1.2s ease-out 0.4s forwards;
    }
    @keyframes cinematic-stars-in {
      to { opacity: 1; }
    }
    .cinematic-splash__scene {
      position: relative;
      z-index: 2;
      perspective: 1400px;
      transform-style: preserve-3d;
      opacity: 0;
      transform: scale(0.85);
      animation: cinematic-scene-in 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__scene {
      animation-duration: 0.7s;
      animation-delay: 0.2s;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__scene {
      animation: cinematic-scene-out 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes cinematic-scene-in {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes cinematic-scene-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(1.15); }
    }
    .cinematic-splash__portal-wrap {
      position: relative;
      width: min(85vmin, 440px);
      height: min(85vmin, 440px);
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      animation: cinematic-portal-float 6s ease-in-out infinite;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__portal-wrap {
      animation: none;
    }
    @keyframes cinematic-portal-float {
      0%, 100% { transform: rotateY(0deg) rotateX(2deg); }
      50% { transform: rotateY(5deg) rotateX(-1deg); }
    }
    .cinematic-splash__portal {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
    }
    .cinematic-splash__portal-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid transparent;
      opacity: 0;
      animation: cinematic-ring-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .cinematic-splash__portal-ring--outer {
      width: 100%;
      height: 100%;
      border-color: rgba(0, 229, 255, 0.5);
      box-shadow: 0 0 40px rgba(0, 229, 255, 0.2), inset 0 0 30px rgba(0, 229, 255, 0.05);
      animation-delay: 0.7s;
      animation-fill-mode: backwards;
    }
    .cinematic-splash__portal-ring--mid {
      width: 78%;
      height: 78%;
      border-color: rgba(0, 255, 136, 0.4);
      box-shadow: 0 0 25px rgba(0, 255, 136, 0.15);
      animation-delay: 0.85s;
      animation-fill-mode: backwards;
    }
    .cinematic-splash__portal-ring--inner {
      width: 52%;
      height: 52%;
      border-color: rgba(0, 229, 255, 0.6);
      box-shadow: 0 0 20px rgba(0, 229, 255, 0.25);
      animation-delay: 1s;
      animation-fill-mode: backwards;
    }
    @keyframes cinematic-ring-in {
      from {
        opacity: 0;
        transform: scale(0.7);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .cinematic-splash__mascot-wrap {
      position: relative;
      z-index: 3;
      transform-style: preserve-3d;
      opacity: 0;
      transform: scale(0.5) translateZ(-60px);
      animation: cinematic-mascot-emerge 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__mascot-wrap {
      animation-duration: 0.6s;
      animation-delay: 0.4s;
    }
    @keyframes cinematic-mascot-emerge {
      to {
        opacity: 1;
        transform: scale(1) translateZ(0);
      }
    }
    .cinematic-splash__mascot-img {
      display: block;
      width: 220px;
      height: auto;
      max-height: 220px;
      min-height: 220px;
      object-fit: contain;
      filter: drop-shadow(0 0 30px rgba(0, 229, 255, 0.4)) drop-shadow(0 0 60px rgba(0, 255, 136, 0.2));
    }
    .cinematic-splash__rays {
      position: absolute;
      inset: -50%;
      background: conic-gradient(from 0deg at 50% 50%, transparent 0deg 60deg, rgba(0,229,255,0.03) 60deg 120deg, transparent 120deg 240deg, rgba(0,255,136,0.02) 240deg 300deg, transparent 300deg);
      animation: cinematic-rays-pulse 4s ease-in-out infinite;
      pointer-events: none;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__rays {
      animation: none;
      opacity: 0.5;
    }
    @keyframes cinematic-rays-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    .cinematic-splash__hint {
      position: absolute;
      bottom: 2.5rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-secondary);
      opacity: 0;
      animation: cinematic-hint-in 0.8s ease-out 2s forwards;
    }
    @keyframes cinematic-hint-in {
      to { opacity: 0.5; }
    }
  `;
}

export default InitialAnimation;

export function shouldShowInitialAnimation() {
  if (typeof sessionStorage === 'undefined') return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}
