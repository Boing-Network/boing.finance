import React, { useEffect, useRef } from 'react';
import { CONFETTI_COLORS } from '../theme/designTokens';

export default function Confetti({ active, onComplete, duration = 2500 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Deep Trade design system (canvas needs resolved hex/rgba)
    const colors = CONFETTI_COLORS;
    const particles = [];
    const count = 80;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 10 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
        return;
      }
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - elapsed / duration;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      requestAnimationFrame(animate);
    }

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active, duration, onComplete]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[99]" style={{ width: '100%', height: '100%' }} />;
}
