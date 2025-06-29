import React, { useState, useRef, useEffect } from 'react';

export function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 500, 
  className = '',
  variant = 'info' 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  const handleMouseEnter = (event) => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setCoords({ x: event.clientX, y: event.clientY });
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-600 text-white border-yellow-500';
      case 'error':
        return 'bg-red-600 text-white border-red-500';
      case 'success':
        return 'bg-green-600 text-white border-green-500';
      case 'help':
        return 'bg-blue-600 text-white border-blue-500';
      default:
        return 'bg-gray-800 text-white border-gray-600';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm rounded-lg border shadow-lg whitespace-nowrap ${getVariantClasses()} ${getPositionClasses()}`}
          style={{
            left: coords.x,
            top: coords.y
          }}
        >
          {content}
          <div className={`absolute w-2 h-2 transform rotate-45 ${getVariantClasses().split(' ')[0]} ${getVariantClasses().split(' ')[1]} ${getVariantClasses().split(' ')[2]}`}
               style={{
                 left: position === 'left' ? '100%' : position === 'right' ? '-4px' : '50%',
                 top: position === 'top' ? '100%' : position === 'bottom' ? '-4px' : '50%',
                 transform: position === 'left' || position === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
               }}
          />
        </div>
      )}
    </div>
  );
}

export function InfoTooltip({ content, ...props }) {
  return <Tooltip content={content} variant="info" {...props} />;
}

export function WarningTooltip({ content, ...props }) {
  return <Tooltip content={content} variant="warning" {...props} />;
}

export function ErrorTooltip({ content, ...props }) {
  return <Tooltip content={content} variant="error" {...props} />;
}

export function SuccessTooltip({ content, ...props }) {
  return <Tooltip content={content} variant="success" {...props} />;
}

export function HelpTooltip({ content, ...props }) {
  return <Tooltip content={content} variant="help" {...props} />;
} 