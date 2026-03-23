// Skeleton Loading Components
// Provides better UX during data loading

import React from 'react';

// Portfolio Summary Skeleton
export const PortfolioSummarySkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 animate-pulse">
          <div className="h-5 bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-10 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};

// Token Balance Skeleton
export const TokenBalanceSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 animate-pulse">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-5 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pool Card Skeleton
export const PoolCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
            <div className="w-12 h-12 bg-gray-700 rounded-full -ml-3"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Analytics Card Skeleton
export const AnalyticsCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 animate-pulse">
          <div className="h-5 bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-10 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5, rows = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 p-4 bg-gray-800 rounded border border-gray-700 animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <div className="h-4 bg-gray-700 rounded" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton = ({ height = '300px' }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-700 rounded-t"
              style={{
                width: '4%',
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 50}ms`
              }}
            ></div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <div className="h-4 bg-gray-700 rounded w-20"></div>
        <div className="h-4 bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
};

// Generic Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800 rounded border border-gray-700 animate-pulse">
          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-24"></div>
          </div>
          <div className="h-5 bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};

const SkeletonLoader = {
  PortfolioSummarySkeleton,
  TokenBalanceSkeleton,
  PoolCardSkeleton,
  AnalyticsCardSkeleton,
  TableRowSkeleton,
  ChartSkeleton,
  CardSkeleton,
  ListItemSkeleton
};
export default SkeletonLoader;
