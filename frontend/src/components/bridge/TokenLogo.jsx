import React, { useState } from 'react';

/** Token or chain logo from LI.FI, with a letter fallback when the image is missing or blocked. */
export default function TokenLogo({ src, label, size = 28, className = '' }) {
  const [failed, setFailed] = useState(false);
  const letter = String(label || '?').replace(/^\W+/, '').charAt(0).toUpperCase() || '?';
  const style = { width: size, height: size, minWidth: size };
  if (!src || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full text-xs font-bold ${className}`}
        style={{ ...style, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        aria-hidden="true"
      >
        {letter}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`rounded-full object-cover ${className}`}
      style={style}
    />
  );
}
