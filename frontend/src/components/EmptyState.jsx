// EmptyState Component
// Illustrated empty states with call-to-action across the app

import React from 'react';

function EmptyIcon({ variant }) {
  const stroke = 'var(--finance-primary)';
  const common = {
    width: 40,
    height: 40,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (variant) {
    case 'activity':
    case 'transactions':
      return (
        <svg {...common}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0z" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case 'tokens':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M9.5 10.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5M9.5 13.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" />
        </svg>
      );
    case 'pools':
      return (
        <svg {...common}>
          <path d="M12 3c-2.5 4-6 6.5-6 10a6 6 0 0012 0c0-3.5-3.5-6-6-10z" />
        </svg>
      );
    case 'nfts':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M3 15l5-4 4 3 3-2 6 5" />
        </svg>
      );
    case 'bridge':
      return (
        <svg {...common}>
          <path d="M7 16V8M17 8v8M4 12h16" />
          <path d="M7 8c2-3 8-3 10 0M7 16c2 3 8 3 10 0" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M4 10h16" />
        </svg>
      );
  }
}

export default function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  secondaryAction,
  secondaryLabel,
  secondaryHref,
  className = '',
}) {
  const hasCustomIcon = icon != null;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--finance-primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--finance-primary) 28%, transparent)',
        }}
        aria-hidden="true"
      >
        {hasCustomIcon ? (
          typeof icon === 'string' ? (
            <span className="text-2xl opacity-80">{icon}</span>
          ) : (
            icon
          )
        ) : (
          <EmptyIcon variant={variant} />
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {(action || actionLabel || actionHref) && (
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <button type="button" onClick={action} className="td-btn td-btn--primary">
              {actionLabel || 'Get started'}
            </button>
          )}
          {actionHref && !action && (
            <a href={actionHref} className="td-btn td-btn--primary">
              {actionLabel || 'Get started'}
            </a>
          )}
          {(secondaryAction || secondaryHref) &&
            (secondaryAction ? (
              <button type="button" onClick={secondaryAction} className="td-btn td-btn--ghost">
                {secondaryLabel || 'Learn more'}
              </button>
            ) : (
              <a href={secondaryHref} className="td-btn td-btn--ghost">
                {secondaryLabel || 'Learn more'}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
