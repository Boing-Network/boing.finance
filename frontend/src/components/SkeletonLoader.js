import React from 'react';

/**
 * Skeleton Loader Components
 * Used for loading states while data is being fetched
 */

/**
 * Generic skeleton loader with customizable rows
 */
export const SkeletonLoader = ({ rows = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="h-4 rounded"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            width: i === rows - 1 ? '75%' : '100%'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Token list skeleton loader
 */
export const TokenListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 rounded-lg border animate-pulse"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div
            className="w-12 h-12 rounded-full"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-4 rounded w-1/4"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
            <div
              className="h-3 rounded w-1/3"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
          </div>
          <div className="text-right space-y-2">
            <div
              className="h-4 rounded w-20"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
            <div
              className="h-3 rounded w-16"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Pool card skeleton loader
 */
export const PoolCardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-xl border animate-pulse"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
            <div
              className="w-10 h-10 rounded-full -ml-2"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
            <div className="flex-1">
              <div
                className="h-4 rounded w-24 mb-2"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
              <div
                className="h-3 rounded w-32"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="h-4 rounded w-full"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
            <div
              className="h-4 rounded w-3/4"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Transaction history skeleton loader
 */
export const TransactionSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg border animate-pulse"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            />
            <div className="space-y-1">
              <div
                className="h-4 rounded w-32"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
              <div
                className="h-3 rounded w-24"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
            </div>
          </div>
          <div
            className="h-4 rounded w-20"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;

