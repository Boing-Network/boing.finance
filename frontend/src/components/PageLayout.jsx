import React from 'react';

/**
 * Shared page layout wrapper for consistent structure across Swap, Bridge, Analytics, Portfolio.
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-lg sm:text-xl max-w-2xl"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap gap-2 shrink-0">{children}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Card wrapper with consistent styling.
 */
export function PageCard({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 shadow-lg border ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Standard content width + horizontal padding for feature pages (matches footer shell).
 */
export function AppPageShell({ children, className = '' }) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 ${className}`}>
      {children}
    </div>
  );
}

const PageLayout = { PageHeader, PageCard, AppPageShell };
export default PageLayout;
