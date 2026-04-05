/**
 * boing.finance — "The Trade" cinematic intro
 *
 * Storyboard: Two token streams (cyan=ETH, green=BOING) fly through space,
 * converge at center, collide in a swap flash, and crystallise into the
 * trading interface. ~4–4.5s, skippable, then seamless transition to app.
 *
 * Based on boing-cinematic-intros storyboards and finance reference.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const CYAN = { r: 0, g: 229, b: 255 };
const GREEN = { r: 0, g: 255, b: 136 };
const DEEP_BG = '#020B26';

const TOTAL_MS = 4500;
const TOTAL_REDUCED_MS = 1800;

const T = {
  streamsStart: 0,
  convergence: 1200,
  collision: 2000,
  flashPeak: 2200,
  flashFade: 2600,
  uiReveal: 2500,
  textShow: 2900,
  pullback: 3200,
  outroStart: 3500,
  end: 4500,
};

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeIn(t) {
  return t * t * t;
}
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function invLerp(a, b, v) {
  return clamp((v - a) / (b - a), 0, 1);
}
function range(t0, t1, t) {
  return easeInOut(invLerp(t0, t1, t));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

class ParticleStream {
  constructor(color, startX, startY, endX, endY, count) {
    this.color = color;
    this.sx = startX;
    this.sy = startY;
    this.ex = endX;
    this.ey = endY;
    this.count = count;
    this.particles = Array.from({ length: count }, (_, i) => ({
      offset: i / count,
      wobble: (Math.random() - 0.5) * 0.08,
      wobbleSpeed: 0.5 + Math.random(),
      size: 1.5 + Math.random() * 2.5,
      brightness: 0.6 + Math.random() * 0.4,
    }));
  }

  draw(ctx, W, H, progress, t) {
    if (progress <= 0) return;
    this.particles.forEach((p) => {
      const pp = (p.offset + progress * 1.2) % 1.0;
      if (pp > progress * 1.1) return;
      const ep = Math.min(pp / progress, 1);
      const px = lerp(this.sx, this.ex, easeIn(ep));
      const py = lerp(this.sy, this.ey, easeIn(ep));
      const wobbleAmt = Math.sin(t * 0.002 * p.wobbleSpeed + p.offset * 10) * W * p.wobble;
      const perpX = -(this.ey - this.sy) / Math.hypot(this.ex - this.sx, this.ey - this.sy);
      const perpY = (this.ex - this.sx) / Math.hypot(this.ex - this.sx, this.ey - this.sy);
      const fx = px + perpX * wobbleAmt;
      const fy = py + perpY * wobbleAmt;
      const alpha = p.brightness * (1 - Math.abs(ep - 0.5) * 0.6);

      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(fx, fy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

function drawGrid(ctx, W, H, opacity) {
  if (opacity <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = opacity * 0.12;
  ctx.strokeStyle = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},1)`;
  ctx.lineWidth = 0.5;
  const gs = 60;
  for (let x = 0; x < W; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStars(ctx, W, H, stars, opacity, t) {
  if (opacity <= 0.001) return;
  ctx.save();
  stars.forEach((s) => {
    const tw = s.base + 0.1 * Math.sin(t * 0.001 + s.phase);
    ctx.globalAlpha = opacity * tw;
    ctx.fillStyle = '#e0f0ff';
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSwapUI(ctx, W, H, opacity, scale) {
  if (opacity <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);

  const bw = Math.min(W * 0.32, 320);
  const bh = 220;
  const bx = -bw / 2;
  const by = -bh / 2;
  const r = 16;

  ctx.fillStyle = 'rgba(2,11,38,0.88)';
  ctx.shadowBlur = 40;
  ctx.shadowColor = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.25)`;
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.fill();

  ctx.strokeStyle = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.35)`;
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.stroke();

  const rowH = 48;
  const rowW = bw - 40;
  const rowX = bx + 20;

  ctx.fillStyle = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.08)`;
  roundRect(ctx, rowX, by + 30, rowW, rowH, 8);
  ctx.fill();
  ctx.fillStyle = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.8)`;
  ctx.font = '600 13px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('⟠ ETH', rowX + 12, by + 62);
  ctx.fillStyle = '#f0f9ff';
  ctx.textAlign = 'right';
  ctx.fillText('1.000', rowX + rowW - 12, by + 62);
  ctx.textAlign = 'left';

  ctx.fillStyle = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.4)`;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⇅', 0, by + 100);
  ctx.textAlign = 'left';

  ctx.fillStyle = `rgba(${GREEN.r},${GREEN.g},${GREEN.b},0.08)`;
  roundRect(ctx, rowX, by + 110, rowW, rowH, 8);
  ctx.fill();
  ctx.fillStyle = `rgba(${GREEN.r},${GREEN.g},${GREEN.b},0.8)`;
  ctx.font = '600 13px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('◈ BOING', rowX + 12, by + 142);
  ctx.fillStyle = '#f0f7ff';
  ctx.textAlign = 'right';
  ctx.fillText('67,567,567', rowX + rowW - 12, by + 142);
  ctx.textAlign = 'left';

  const grad = ctx.createLinearGradient(rowX, 0, rowX + rowW, 0);
  grad.addColorStop(0, `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.9)`);
  grad.addColorStop(1, 'rgba(0,153,204,0.9)');
  ctx.fillStyle = grad;
  ctx.shadowBlur = 20;
  ctx.shadowColor = `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0.4)`;
  roundRect(ctx, rowX, by + 170, rowW, 36, 8);
  ctx.fill();
  ctx.fillStyle = '#020B26';
  ctx.font = '700 13px Orbitron, ui-sans-serif, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Swap →', 0, by + 194);

  ctx.restore();
}

function CinematicIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const doneRef = useRef(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSceneText, setShowSceneText] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const totalMs = prefersReducedMotion ? TOTAL_REDUCED_MS : TOTAL_MS;
  const scale = totalMs / TOTAL_MS;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setExiting(true);
    const OUTRO_MS = prefersReducedMotion ? 500 : 1000;
    const t = setTimeout(() => {
      onComplete?.();
    }, OUTRO_MS);
    return () => clearTimeout(t);
  }, [onComplete, prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const streamCyan = new ParticleStream(
      `rgba(${CYAN.r},${CYAN.g},${CYAN.b},1)`,
      -W * 0.1,
      -H * 0.1,
      W / 2,
      H / 2,
      60
    );
    const streamGreen = new ParticleStream(
      `rgba(${GREEN.r},${GREEN.g},${GREEN.b},1)`,
      W * 1.1,
      H * 1.1,
      W / 2,
      H / 2,
      60
    );
    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.0,
      base: 0.08 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }));

    const Tscaled = {
      streamsStart: T.streamsStart * scale,
      convergence: T.convergence * scale,
      collision: T.collision * scale,
      flashPeak: T.flashPeak * scale,
      flashFade: T.flashFade * scale,
      uiReveal: T.uiReveal * scale,
      textShow: T.textShow * scale,
      pullback: T.pullback * scale,
      outroStart: T.outroStart * scale,
      end: T.end * scale,
    };

    function render(ts) {
      if (doneRef.current) return;
      if (!startTimeRef.current) startTimeRef.current = ts;
      const t = ts - startTimeRef.current;

      setProgress(Math.min(100, (t / totalMs) * 100));

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = DEEP_BG;
      ctx.fillRect(0, 0, W, H);

      drawStars(ctx, W, H, stars, clamp(range(0, 800 * scale, t), 0, 1) * 0.5, t);

      const gridP = clamp(range(200 * scale, 1000 * scale, t), 0, 1);
      drawGrid(ctx, W, H, gridP);

      const streamP = clamp(range(Tscaled.streamsStart, Tscaled.convergence, t), 0, 1);
      const streamFade = 1 - clamp(range(Tscaled.collision, Tscaled.flashPeak, t), 0, 1);

      if (streamFade > 0) {
        ctx.save();
        ctx.globalAlpha = streamFade;
        streamCyan.draw(ctx, W, H, streamP, t);
        streamGreen.draw(ctx, W, H, streamP, t);
        ctx.restore();
      }

      const flashP = invLerp(Tscaled.collision, Tscaled.flashPeak, t);
      const flashFadeP = invLerp(Tscaled.flashPeak, Tscaled.flashFade, t);
      const flashO =
        t < Tscaled.flashPeak
          ? easeOut(flashP) * 0.9
          : (1 - easeIn(flashFadeP)) * 0.9;

      if (flashO > 0.001) {
        const fr = lerp(
          0,
          W * 0.55,
          easeOut(invLerp(Tscaled.collision, Tscaled.flashFade, t))
        );
        const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, fr);
        grd.addColorStop(0, `rgba(255,255,255,${flashO})`);
        grd.addColorStop(0.1, `rgba(${CYAN.r},${CYAN.g},${CYAN.b},${flashO * 0.8})`);
        grd.addColorStop(0.4, `rgba(${GREEN.r},${GREEN.g},${GREEN.b},${flashO * 0.4})`);
        grd.addColorStop(1, `rgba(${CYAN.r},${CYAN.g},${CYAN.b},0)`);
        ctx.save();
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      const uiP = clamp(range(Tscaled.uiReveal, Tscaled.uiReveal + 600 * scale, t), 0, 1);
      const pullP = clamp(range(Tscaled.pullback, Tscaled.outroStart, t), 0, 1);
      const uiScale = lerp(1.15, lerp(1.0, 0.92, pullP), uiP);
      drawSwapUI(ctx, W, H, easeOut(uiP) * (1 - pullP * 0.3), uiScale);

      if (t >= Tscaled.textShow) setShowSceneText(true);

      if (t >= totalMs) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [totalMs, scale, finish]);

  const handleSkip = () => finish();

  return (
    <div
      className="cinematic-intro"
      data-exiting={exiting ? 'true' : undefined}
      role="presentation"
      aria-hidden="true"
    >
      <style>{`
        .cinematic-intro {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #020B26;
          overflow: hidden;
          transition: opacity 1s ease, visibility 1.1s ease;
        }
        .cinematic-intro[data-exiting="true"] {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .cinematic-intro__skip {
          position: absolute;
          top: 22px;
          right: 24px;
          z-index: 10;
          background: rgba(0,229,255,0.07);
          border: 1px solid rgba(0,229,255,0.2);
          color: rgba(0,229,255,0.6);
          font-family: var(--font-body, Inter, system-ui, sans-serif);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          animation: cinematic-intro-fade-in 0.5s ease 0.3s both;
        }
        .cinematic-intro__skip:hover {
          background: rgba(0,229,255,0.14);
          color: #00e5ff;
        }
        @keyframes cinematic-intro-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cinematic-intro__canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }
        .cinematic-intro__scene-text {
          position: absolute;
          left: 50%;
          bottom: 16%;
          transform: translateX(-50%);
          text-align: center;
          pointer-events: none;
          opacity: 0;
        }
        .cinematic-intro__scene-text.show {
          animation: cinematic-intro-text-in 0.6s ease forwards;
        }
        @keyframes cinematic-intro-text-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .cinematic-intro__scene-label {
          font-family: Orbitron, ui-sans-serif, sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(0,229,255,0.5);
          margin-bottom: 6px;
        }
        .cinematic-intro__scene-title {
          font-family: Orbitron, ui-sans-serif, sans-serif;
          font-size: clamp(1.4rem, 3.5vw, 2.8rem);
          font-weight: 900;
          color: #f0f7ff;
          text-shadow: 0 0 30px rgba(0,229,255,0.6);
        }
        .cinematic-intro__scene-sub {
          font-size: 0.88rem;
          color: rgba(176,220,240,0.55);
          margin-top: 8px;
        }
        .cinematic-intro__progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, #00e5ff, rgba(0,229,255,0.3));
          box-shadow: 0 0 8px rgba(0,229,255,0.6);
          transition: width 50ms linear;
        }
      `}</style>
      <button
        type="button"
        className="cinematic-intro__skip"
        onClick={handleSkip}
        aria-label="Skip intro"
      >
        Skip ›
      </button>
      <canvas
        ref={canvasRef}
        className="cinematic-intro__canvas"
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
      />
      <div
        className={`cinematic-intro__scene-text${showSceneText ? ' show' : ''}`}
        aria-hidden
      >
        <div className="cinematic-intro__scene-label">DeFi That Bounces Back</div>
        <div className="cinematic-intro__scene-title">boing.finance</div>
        <div className="cinematic-intro__scene-sub">Swap. Bridge. Deploy. Zero fees.</div>
      </div>
      <div
        className="cinematic-intro__progress"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    </div>
  );
}

export default CinematicIntro;

/** Show intro on every landing page load/reload. Use ?noIntro=1 to skip for testing. */
export function shouldShowCinematicIntro() {
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('noIntro') === '1') return false;
  return true;
}
