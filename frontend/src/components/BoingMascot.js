import React, { useState } from 'react';

/**
 * Boing mascot with easter egg: click to bounce / celebrate.
 */
export default function BoingMascot({ className = '' }) {
  const [bounce, setBounce] = useState(false);

  const handleClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-full transition-transform ${bounce ? 'scale-110' : 'hover:scale-105'} ${className}`}
      aria-label="Boing mascot - click to bounce"
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 200 200"
        className={`${bounce ? 'animate-bounce' : 'animate-float'}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <ellipse cx="100" cy="175" rx="28" ry="8" fill="#1e293b" opacity="0.13" />
          <ellipse cx="100" cy="85" rx="48" ry="44" fill="#fff" stroke="#bfc9d9" strokeWidth="3" />
          <ellipse cx="100" cy="85" rx="42" ry="38" fill="#00E0FF" fillOpacity="0.2" stroke="#7dd3fc" strokeWidth="3" />
          <ellipse cx="100" cy="90" rx="32" ry="30" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="88" cy="95" rx="5" ry="5" fill="#60a5fa" />
          <ellipse cx="112" cy="95" rx="5" ry="5" fill="#60a5fa" />
          <ellipse cx="88" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
          <ellipse cx="112" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
          <ellipse cx="85" cy="75" rx="12" ry="6" fill="#fff" opacity="0.18" />
          <ellipse cx="100" cy="140" rx="28" ry="24" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="78" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="122" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="72" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="128" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="88" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="112" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
          <ellipse cx="88" cy="180" rx="8" ry="4" fill="#a5b4fc" />
          <ellipse cx="112" cy="180" rx="8" ry="4" fill="#a5b4fc" />
          <ellipse cx="100" cy="150" rx="10" ry="8" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="1.5" />
        </g>
        {!bounce && (
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -12; 0 0" dur="4s" repeatCount="indefinite" />
        )}
      </svg>
    </button>
  );
}
