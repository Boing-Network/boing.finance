// Contextual Help Component
// Provides tooltips and contextual help throughout the app

import React, { useState, useEffect, useRef } from 'react';

const ContextualHelp = ({ 
  content, 
  position = 'top', 
  children, 
  className = '',
  showOnHover = true,
  showOnClick = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      // Position tooltip
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      
      // Adjust position if tooltip goes off screen
      if (rect.right > window.innerWidth) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
      }
      if (rect.bottom > window.innerHeight) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '100%';
      }
    }
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => {
        if (showOnHover) {
          setIsHovered(true);
          setIsVisible(true);
        }
      }}
      onMouseLeave={() => {
        if (showOnHover) {
          setIsHovered(false);
          setIsVisible(false);
        }
      }}
      onClick={() => {
        if (showOnClick) {
          setIsVisible(!isVisible);
        }
      }}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-xl max-w-xs`}
          role="tooltip"
        >
          <div className="whitespace-pre-wrap">{content}</div>
          <div className={`absolute ${arrowClasses[position]} border-4 border-transparent`} />
        </div>
      )}
    </div>
  );
};

// Help Icon Component
export const HelpIcon = ({ content, position = 'top' }) => {
  return (
    <ContextualHelp content={content} position={position} showOnHover={true} showOnClick={false}>
      <button
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
        aria-label="Help"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    </ContextualHelp>
  );
};

// Info Tooltip Component
export const InfoTooltip = ({ content, children, position = 'top' }) => {
  return (
    <ContextualHelp content={content} position={position} showOnHover={true}>
      {children || <HelpIcon content={content} position={position} />}
    </ContextualHelp>
  );
};

export default ContextualHelp;

