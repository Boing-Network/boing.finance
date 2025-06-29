import React from 'react';

const Logo = ({ size = 40, className = "", showText = false }) => (
  <div className={`flex items-center ${className}`}>
    <img
      src="/logo.svg"
      alt="boing logo"
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
    />
    {showText && (
      <span className="ml-2 text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-cyan-300 hover:via-blue-400 hover:to-purple-500 transition-all duration-300">
        boing
      </span>
    )}
  </div>
);

export default Logo; 