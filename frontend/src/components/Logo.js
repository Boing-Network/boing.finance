import React from 'react';

const Logo = ({ size = 40, className = "", showText = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo.svg"
        alt="boing logo"
        width={size}
        height={size}
        style={{ 
          display: 'inline-block',
          filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.3))'
        }}
      />
      {showText && (
        <span className="ml-2 text-xl font-normal bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent hover:from-cyan-300 hover:via-cyan-400 hover:to-blue-500 transition-all duration-300">
          boing.finance
        </span>
      )}
    </div>
  );
};

export default Logo; 