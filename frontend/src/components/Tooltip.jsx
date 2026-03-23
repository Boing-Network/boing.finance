// Reusable Tooltip component for metrics and UI hints
import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs text-gray-100 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-w-xs whitespace-normal pointer-events-none ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gray-800 border-gray-600 rotate-45 ${
            position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b' :
            position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t' :
            position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-t border-r' :
            'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-b border-l'
          }`} />
        </div>
      )}
    </div>
  );
};

// Info icon + tooltip
export const InfoTooltip = ({ content, children, position = 'top', className = '' }) => (
  <Tooltip content={content} position={position} className={className}>
    {children ?? (
      <svg className="w-4 h-4 text-gray-400 hover:text-cyan-400 cursor-help inline-block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )}
  </Tooltip>
);

// Warning icon + tooltip
export const WarningTooltip = ({ content, children, position = 'top', className = '' }) => (
  <Tooltip content={content} position={position} className={className}>
    {children ?? (
      <svg className="w-4 h-4 text-yellow-500 hover:text-yellow-400 cursor-help inline-block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )}
  </Tooltip>
);

// Help icon + tooltip (alias for info-style hints)
export const HelpTooltip = ({ content, children, position = 'top', className = '' }) => (
  <InfoTooltip content={content} position={position} className={className}>
    {children}
  </InfoTooltip>
);

export default Tooltip;
