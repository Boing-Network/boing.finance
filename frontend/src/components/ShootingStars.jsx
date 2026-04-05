import React from 'react';

/**
 * Nebula theme: trails use CSS tokens (--accent-teal / --accent-cyan / --accent-purple).
 */
const BOING_PRIMARY = 'var(--accent-teal)';
const BOING_SECONDARY = 'var(--accent-cyan)';
const COSMIC_ACCENT = 'var(--accent-purple)';
const GLOW_CYAN = 'var(--glow-cyan)';
const GLOW_BLUE = 'var(--glow-blue)';
const GLOW_PURPLE = 'var(--glow-purple)';

const trailStyle = (fromColor, toColor, shadowColor) => ({
  background: `linear-gradient(to right, transparent, ${fromColor}, ${toColor})`,
  boxShadow: `0 0 8px ${shadowColor}`,
});

const ShootingStars = ({ className = '', dense = false }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Shooting star 1 - teal */}
      <div className="absolute top-1/4 left-0 animate-shooting-star-1 opacity-60">
        <div
          className="w-32 h-0.5 rotate-[-15deg] origin-left"
          style={trailStyle('transparent', BOING_PRIMARY, GLOW_CYAN)}
        />
      </div>
      {/* Shooting star 2 - blue */}
      <div className="absolute top-1/3 right-0 animate-shooting-star-2 opacity-50">
        <div
          className="w-28 h-0.5 rotate-[165deg] origin-right"
          style={trailStyle('transparent', BOING_SECONDARY, GLOW_BLUE)}
        />
      </div>
      {/* Shooting star 3 - purple cosmic */}
      <div className="absolute bottom-1/4 left-1/4 animate-shooting-star-3 opacity-40">
        <div
          className="w-24 h-0.5 rotate-[45deg] origin-left"
          style={trailStyle('transparent', COSMIC_ACCENT, GLOW_PURPLE)}
        />
      </div>
      {/* Shooting star 4 - teal */}
      <div className="absolute top-1/2 right-1/3 animate-shooting-star-4 opacity-30">
        <div
          className="w-20 h-0.5 rotate-[-135deg] origin-right"
          style={trailStyle('transparent', BOING_PRIMARY, GLOW_CYAN)}
        />
      </div>
      {/* Extra trails - dense */}
      <div className="absolute top-1/6 right-1/4 animate-shooting-star-5 opacity-50">
        <div
          className="w-24 h-0.5 rotate-[-10deg] origin-left"
          style={trailStyle('transparent', BOING_PRIMARY, GLOW_CYAN)}
        />
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-shooting-star-6 opacity-45">
        <div
          className="w-20 h-0.5 rotate-[170deg] origin-right"
          style={trailStyle('transparent', BOING_SECONDARY, GLOW_BLUE)}
        />
      </div>
      {dense && (
        <>
          <div className="absolute top-2/5 left-1/6 animate-shooting-star-7 opacity-40">
            <div
              className="w-16 h-0.5 rotate-[35deg] origin-left"
              style={trailStyle('transparent', COSMIC_ACCENT, GLOW_PURPLE)}
            />
          </div>
          <div className="absolute top-3/4 right-1/6 animate-shooting-star-8 opacity-35">
            <div
              className="w-20 h-0.5 rotate-[-140deg] origin-right"
              style={trailStyle('transparent', BOING_PRIMARY, GLOW_CYAN)}
            />
          </div>
        </>
      )}

      {/* Floating particles - bioluminescent / cosmic */}
      <div
        className="absolute top-1/6 left-1/6 w-1 h-1 rounded-full animate-float-slow animate-pulse-fade"
        style={{ background: BOING_PRIMARY, boxShadow: '0 0 6px var(--glow-cyan)' }}
      />
      <div
        className="absolute top-2/3 right-1/4 w-0.5 h-0.5 rounded-full animate-float-slower animate-pulse-fade"
        style={{ background: BOING_SECONDARY, boxShadow: '0 0 6px var(--glow-blue)' }}
      />
      <div
        className="absolute bottom-1/3 left-1/2 w-0.5 h-0.5 rounded-full animate-float-slowest animate-pulse-fade"
        style={{ background: COSMIC_ACCENT, boxShadow: '0 0 6px var(--glow-purple)' }}
      />
      <div
        className="absolute top-1/4 right-1/6 w-0.5 h-0.5 rounded-full animate-float-slow animate-pulse-fade"
        style={{ background: BOING_PRIMARY, boxShadow: '0 0 6px var(--glow-cyan)' }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-1 h-1 rounded-full animate-float-slower animate-pulse-fade"
        style={{ background: BOING_SECONDARY, boxShadow: '0 0 6px var(--glow-blue)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-0.5 h-0.5 rounded-full animate-float-slowest animate-pulse-fade"
        style={{ background: COSMIC_ACCENT, boxShadow: '0 0 6px var(--glow-purple)' }}
      />
      <div
        className="absolute top-3/4 left-1/3 w-0.5 h-0.5 rounded-full animate-float-slow animate-pulse-fade"
        style={{ background: BOING_PRIMARY, boxShadow: '0 0 6px var(--glow-cyan)' }}
      />
      <div
        className="absolute bottom-1/6 right-1/6 w-1 h-1 rounded-full animate-float-slower animate-pulse-fade"
        style={{ background: BOING_SECONDARY, boxShadow: '0 0 6px var(--glow-blue)' }}
      />
      <div
        className="absolute top-1/3 left-2/3 w-0.5 h-0.5 rounded-full animate-float-slowest animate-pulse-fade"
        style={{ background: COSMIC_ACCENT, boxShadow: '0 0 6px var(--glow-purple)' }}
      />
      <div
        className="absolute top-1/8 right-1/2 w-0.5 h-0.5 rounded-full animate-float-slow animate-pulse-fade"
        style={{ background: BOING_PRIMARY, boxShadow: '0 0 6px var(--glow-cyan)' }}
      />
      <div
        className="absolute bottom-1/8 left-1/8 w-1 h-1 rounded-full animate-float-slower animate-pulse-fade"
        style={{ background: BOING_SECONDARY, boxShadow: '0 0 6px var(--glow-blue)' }}
      />
      <div
        className="absolute top-5/6 right-1/8 w-0.5 h-0.5 rounded-full animate-float-slowest animate-pulse-fade"
        style={{ background: COSMIC_ACCENT, boxShadow: '0 0 6px var(--glow-purple)' }}
      />
      {dense && (
        <>
          <div
            className="absolute top-1/3 right-1/3 w-0.5 h-0.5 rounded-full animate-float-slow animate-pulse-fade"
            style={{ background: BOING_PRIMARY, opacity: 0.6, animationDelay: '1s' }}
          />
          <div
            className="absolute bottom-1/4 left-1/2 w-0.5 h-0.5 rounded-full animate-float-slower animate-pulse-fade"
            style={{ background: BOING_SECONDARY, opacity: 0.6, animationDelay: '3s' }}
          />
          <div
            className="absolute top-2/3 left-1/5 w-0.5 h-0.5 rounded-full animate-float-slowest animate-pulse-fade"
            style={{ background: COSMIC_ACCENT, opacity: 0.6, animationDelay: '2s' }}
          />
        </>
      )}
    </div>
  );
};

export default ShootingStars;
