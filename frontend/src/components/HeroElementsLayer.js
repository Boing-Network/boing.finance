import React, { useState, useEffect } from 'react';

const ELEMENTS_BASE = `${process.env.PUBLIC_URL || ''}/images/hero_elements`;

/**
 * Loads extracted hero elements (from extract_robot_hero_elements.py) and
 * renders them with 3D motion animations. Fits the outerspace-oceanic theme.
 */
function HeroElementsLayer() {
  const [elements, setElements] = useState([]);
  const [loaded, setLoaded] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch(`${ELEMENTS_BASE}/manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((manifest) => {
        if (cancelled || !manifest || !Array.isArray(manifest)) return;
        setElements(manifest);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (elements.length === 0) return null;

  const positions = [
    { left: '8%', top: '15%', scale: 0.4, delay: 0 },
    { left: '75%', top: '12%', scale: 0.35, delay: 0.5 },
    { left: '12%', top: '55%', scale: 0.5, delay: 1 },
    { left: '80%', top: '60%', scale: 0.38, delay: 1.5 },
    { left: '45%', top: '25%', scale: 0.45, delay: 0.2 },
    { left: '25%', top: '75%', scale: 0.32, delay: 1.2 },
    { left: '65%', top: '78%', scale: 0.36, delay: 0.8 },
    { left: '50%', top: '50%', scale: 0.42, delay: 0.3 },
  ];

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}
      aria-hidden
    >
      {elements.map((el, i) => {
        const pos = positions[i % positions.length];
        return (
          <div
            key={el.file}
            className="hero-element-3d"
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              width: 0,
              height: 0,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <img
              src={`${ELEMENTS_BASE}/${el.file}`}
              alt=""
              width={el.width}
              height={el.height}
              style={{
                width: el.width ? Math.min(el.width, 180) : 120,
                height: 'auto',
                maxHeight: '22vh',
                objectFit: 'contain',
                opacity: loaded[el.file] ? 0.9 : 0,
                transition: 'opacity 0.6s ease',
                transformStyle: 'preserve-3d',
                filter: 'drop-shadow(0 0 10px rgba(0, 229, 204, 0.2))',
                ['--hero-scale']: pos.scale,
                ['--hero-delay']: `${pos.delay}s`,
              }}
              onLoad={() => setLoaded((p) => ({ ...p, [el.file]: true }))}
            />
          </div>
        );
      })}
      <style>{`
        @keyframes hero-float-3d {
          0%, 100% {
            transform: scale(var(--hero-scale, 0.4)) translateZ(0) rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: scale(var(--hero-scale, 0.4)) translateZ(6px) rotateY(4deg) rotateX(-2deg);
          }
          50% {
            transform: scale(var(--hero-scale, 0.4)) translateZ(12px) rotateY(-2deg) rotateX(3deg);
          }
          75% {
            transform: scale(var(--hero-scale, 0.4)) translateZ(6px) rotateY(3deg) rotateX(1deg);
          }
        }
        .hero-element-3d img {
          animation: hero-float-3d 6s ease-in-out infinite;
          animation-delay: var(--hero-delay, 0s);
        }
        .hero-element-3d:nth-child(odd) img { animation-duration: 7s; }
        .hero-element-3d:nth-child(3n) img { animation-duration: 5.5s; }
      `}</style>
    </div>
  );
}

export default HeroElementsLayer;
