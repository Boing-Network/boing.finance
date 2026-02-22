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
    const OUTRO_MS = prefersReducedMotion ? 700 : 1800;
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
      {/* Layer 1: Black → gradient base with key light */}
      <div className="cinematic-splash__bg" aria-hidden />
      {/* Layer 2: Key light / rim from top-right */}
      <div className="cinematic-splash__key-light" aria-hidden />
      {/* Layer 3: Subtle starfield with parallax drift */}
      <div className="cinematic-splash__stars" aria-hidden />
      {/* Layer 4: Vignette (darkened edges) */}
      <div className="cinematic-splash__vignette" aria-hidden />
      {/* Layer 5: 3D scene (slight Dutch angle + perspective) */}
      <div className="cinematic-splash__scene">
        <div className="cinematic-splash__portal-wrap">
          <div className="cinematic-splash__portal">
            <div className="cinematic-splash__portal-ring cinematic-splash__portal-ring--outer" />
            <div className="cinematic-splash__portal-ring cinematic-splash__portal-ring--mid" />
            <div className="cinematic-splash__portal-ring cinematic-splash__portal-ring--inner" />
          </div>
          <div className="cinematic-splash__mascot-wrap">
            <div className="cinematic-splash__mascot-rim" aria-hidden />
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
        <div className="cinematic-splash__rays" aria-hidden />
        <div className="cinematic-splash__lens-flare" aria-hidden />
      </div>
      {/* Transition: light sweep across screen when exiting */}
      <div className="cinematic-splash__sweep" aria-hidden />
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
      transition: opacity 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 1.7s ease;
    }
    .cinematic-splash[data-exiting="true"] {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition-duration: 1.6s;
    }
    .cinematic-splash__bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 90% 70% at 50% 35%, #041018 0%, #020408 40%, #000 100%);
      opacity: 0;
      animation: cinematic-bg-in 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards;
    }
    .cinematic-splash[data-theme="light"] .cinematic-splash__bg {
      background: radial-gradient(ellipse 90% 70% at 50% 35%, #061828 0%, #030810 45%, #020408 100%);
    }
    @keyframes cinematic-bg-in {
      to { opacity: 1; }
    }
    .cinematic-splash__key-light {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 100% 80% at 75% 20%, rgba(0,229,255,0.08) 0%, transparent 50%);
      opacity: 0;
      animation: cinematic-key-in 1.4s ease-out 0.5s forwards;
      pointer-events: none;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__key-light {
      animation: cinematic-key-out 1.2s ease-in forwards;
    }
    @keyframes cinematic-key-in {
      to { opacity: 1; }
    }
    @keyframes cinematic-key-out {
      to { opacity: 0; }
    }
    .cinematic-splash__stars {
      position: absolute;
      inset: -10%;
      background-image:
        radial-gradient(1.5px 1.5px at 20% 30%, rgba(0,229,255,0.45), transparent),
        radial-gradient(1.5px 1.5px at 60% 70%, rgba(0,255,136,0.35), transparent),
        radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.4), transparent),
        radial-gradient(1px 1px at 40% 80%, rgba(0,229,255,0.28), transparent);
      background-size: 200% 200%;
      opacity: 0;
      animation: cinematic-stars-in 1.3s ease-out 0.4s forwards;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__stars {
      animation: cinematic-stars-in 0.8s ease-out 0.3s forwards;
    }
    .cinematic-splash:not([data-reduced="true"]) .cinematic-splash__stars {
      animation: cinematic-stars-in 1.3s ease-out 0.4s forwards, cinematic-stars-drift 20s linear infinite 2s;
    }
    @keyframes cinematic-stars-in {
      to { opacity: 1; }
    }
    @keyframes cinematic-stars-drift {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }
    .cinematic-splash__vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%);
      opacity: 0;
      animation: cinematic-vignette-in 1s ease-out 0.8s forwards;
      pointer-events: none;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__vignette {
      animation: cinematic-vignette-out 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes cinematic-vignette-in {
      to { opacity: 1; }
    }
    @keyframes cinematic-vignette-out {
      to { opacity: 0; }
    }
    .cinematic-splash__scene {
      position: relative;
      z-index: 2;
      perspective: 1200px;
      transform-style: preserve-3d;
      opacity: 0;
      transform: scale(0.82) rotateZ(-1.2deg);
      animation: cinematic-scene-in 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.45s forwards;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__scene {
      animation-duration: 0.75s;
      animation-delay: 0.2s;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__scene {
      animation: cinematic-scene-out 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes cinematic-scene-in {
      from { opacity: 0; transform: scale(0.82) rotateZ(-1.2deg); }
      to { opacity: 1; transform: scale(1) rotateZ(-1deg); }
    }
    @keyframes cinematic-scene-out {
      0% { opacity: 1; transform: scale(1) rotateZ(-1deg); filter: blur(0); }
      40% { opacity: 1; transform: scale(1.08) rotateZ(0deg); filter: blur(2px); }
      100% { opacity: 0; transform: scale(1.2) rotateZ(0deg); filter: blur(8px); }
    }
    .cinematic-splash__portal-wrap {
      position: relative;
      width: min(85vmin, 440px);
      height: min(85vmin, 440px);
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      animation: cinematic-portal-float 8s ease-in-out infinite;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__portal-wrap {
      animation: none;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__portal-wrap {
      animation: cinematic-portal-level 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes cinematic-portal-float {
      0%, 100% { transform: rotateY(-4deg) rotateX(8deg) rotateZ(0.5deg); }
      33% { transform: rotateY(6deg) rotateX(4deg) rotateZ(-0.3deg); }
      66% { transform: rotateY(2deg) rotateX(-2deg) rotateZ(0.4deg); }
    }
    @keyframes cinematic-portal-level {
      to { transform: rotateY(0) rotateX(0) rotateZ(0); }
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
      animation: cinematic-ring-in 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .cinematic-splash__portal-ring--outer {
      width: 100%;
      height: 100%;
      border-color: rgba(0, 229, 255, 0.55);
      box-shadow: 0 0 50px rgba(0, 229, 255, 0.25), inset 0 0 40px rgba(0, 229, 255, 0.06);
      animation-delay: 0.7s;
      animation-fill-mode: backwards;
    }
    .cinematic-splash:not([data-reduced="true"]) .cinematic-splash__portal-ring--outer {
      animation: cinematic-ring-in 0.95s cubic-bezier(0.22, 1, 0.36, 1) 0.7s backwards, cinematic-ring-glow 3s ease-in-out infinite 1.8s;
    }
    .cinematic-splash__portal-ring--mid {
      width: 78%;
      height: 78%;
      border-color: rgba(0, 255, 136, 0.45);
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
      animation-delay: 0.85s;
      animation-fill-mode: backwards;
    }
    .cinematic-splash__portal-ring--inner {
      width: 52%;
      height: 52%;
      border-color: rgba(0, 229, 255, 0.65);
      box-shadow: 0 0 28px rgba(0, 229, 255, 0.3);
      animation-delay: 1s;
      animation-fill-mode: backwards;
    }
    @keyframes cinematic-ring-in {
      from { opacity: 0; transform: scale(0.7); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes cinematic-ring-glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.15); }
    }
    .cinematic-splash__mascot-wrap {
      position: relative;
      z-index: 3;
      transform-style: preserve-3d;
      opacity: 0;
      transform: scale(0.45) translateZ(-80px);
      animation: cinematic-mascot-emerge 1.15s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__mascot-wrap {
      animation-duration: 0.6s;
      animation-delay: 0.4s;
    }
    @keyframes cinematic-mascot-emerge {
      to { opacity: 1; transform: scale(1) translateZ(0); }
    }
    .cinematic-splash__mascot-rim {
      position: absolute;
      inset: -15%;
      border-radius: 50%;
      background: radial-gradient(circle at 65% 25%, rgba(0,229,255,0.12) 0%, transparent 55%);
      pointer-events: none;
    }
    .cinematic-splash__mascot-img {
      position: relative;
      z-index: 1;
      display: block;
      width: 220px;
      height: auto;
      max-height: 220px;
      min-height: 220px;
      object-fit: contain;
      filter: drop-shadow(-8px -4px 20px rgba(0,229,255,0.35)) drop-shadow(8px 4px 24px rgba(0,255,136,0.2)) drop-shadow(0 0 40px rgba(0,229,255,0.25));
    }
    .cinematic-splash__rays {
      position: absolute;
      inset: -50%;
      background: conic-gradient(from 0deg at 50% 50%, transparent 0deg 55deg, rgba(0,229,255,0.04) 55deg 115deg, transparent 115deg 235deg, rgba(0,255,136,0.03) 235deg 295deg, transparent 295deg);
      animation: cinematic-rays-pulse 4.5s ease-in-out infinite;
      pointer-events: none;
    }
    .cinematic-splash[data-reduced="true"] .cinematic-splash__rays {
      animation: none;
      opacity: 0.5;
    }
    @keyframes cinematic-rays-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .cinematic-splash__lens-flare {
      position: absolute;
      top: 15%;
      right: 18%;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%);
      opacity: 0;
      animation: cinematic-flare-in 1.2s ease-out 1.4s forwards;
      pointer-events: none;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__lens-flare {
      animation: cinematic-flare-out 0.8s ease-in forwards;
    }
    @keyframes cinematic-flare-in {
      to { opacity: 1; }
    }
    @keyframes cinematic-flare-out {
      to { opacity: 0; }
    }
    .cinematic-splash__sweep {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: linear-gradient(105deg, transparent 0%, transparent 45%, rgba(0,229,255,0.06) 50%, transparent 55%, transparent 100%);
      background-size: 200% 100%;
      background-position: 200% 0;
      opacity: 0;
      pointer-events: none;
    }
    .cinematic-splash[data-exiting="true"] .cinematic-splash__sweep {
      animation: cinematic-sweep 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
    }
    @keyframes cinematic-sweep {
      0% { opacity: 0; background-position: 200% 0; }
      30% { opacity: 1; }
      70% { opacity: 1; background-position: -100% 0; }
      100% { opacity: 0; background-position: -100% 0; }
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
      animation: cinematic-hint-in 0.8s ease-out 2.2s forwards;
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
