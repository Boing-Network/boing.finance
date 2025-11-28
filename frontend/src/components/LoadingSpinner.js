import React from 'react';

/**
 * Loading Spinner Component
 * Used as fallback for Suspense boundaries
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mb-4"></div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

