import React from 'react';

const Logo = ({ size = 40, className = "", showText = false }) => (
  <div className={`flex items-center ${className}`}>
    <img
      src="/logo.svg"
      alt="mochi logo"
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
    />
    {showText && (
      <span className="ml-2 text-xl font-bold text-white">mochi</span>
    )}
  </div>
);

export default Logo; 