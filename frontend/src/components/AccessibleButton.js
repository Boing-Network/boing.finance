// Accessible Button Component
// Provides enhanced accessibility features for buttons

import React from 'react';

const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  type = 'button',
  className = '',
  onKeyDown,
  ...props
}) => {
  const handleKeyDown = (e) => {
    // Handle Enter and Space keys for button activation
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick?.(e);
    }
    
    // Call custom onKeyDown handler if provided
    onKeyDown?.(e);
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className={`interactive-button ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default AccessibleButton;

