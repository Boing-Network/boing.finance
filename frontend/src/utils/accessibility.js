// Accessibility Utilities
// Provides helper functions for accessibility features

/**
 * Generates a unique ID for ARIA relationships
 */
export const generateAriaId = (prefix = 'aria') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announces a message to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focuses an element safely
 */
export const focusElement = (element, options = {}) => {
  if (!element) return;
  
  try {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (element && typeof element.focus === 'function') {
      element.focus(options);
    }
  } catch (error) {
    console.warn('Failed to focus element:', error);
  }
};

/**
 * Traps focus within a container (for modals)
 */
export const createFocusTrap = (container) => {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTab = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTab);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTab);
  };
};

/**
 * Handles keyboard navigation for lists
 */
export const handleListNavigation = (items, currentIndex, direction) => {
  let newIndex = currentIndex;
  
  if (direction === 'ArrowDown') {
    newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
  } else if (direction === 'ArrowUp') {
    newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
  } else if (direction === 'Home') {
    newIndex = 0;
  } else if (direction === 'End') {
    newIndex = items.length - 1;
  }
  
  return newIndex;
};

/**
 * Gets accessible label for an element
 */
export const getAccessibleLabel = (element) => {
  if (!element) return '';
  
  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title') ||
    element.textContent?.trim() ||
    ''
  );
};

/**
 * Checks if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Skips animation if user prefers reduced motion
 */
export const shouldAnimate = () => {
  return !prefersReducedMotion();
};

