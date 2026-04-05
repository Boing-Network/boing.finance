import React from 'react';

/**
 * Loading Spinner Component
 * Used as fallback for Suspense boundaries
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="w-full min-h-[min(70vh,28rem)] flex flex-1 items-center justify-center p-8">
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

