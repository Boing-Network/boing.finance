// EmptyState Component
// Illustrated empty states with call-to-action across the app

import React from 'react';

const ICONS = {
  activity: '📋',
  transactions: '📋',
  tokens: '🪙',
  pools: '💧',
  nfts: '🖼️',
  bridge: '⇌',
  search: '🔍',
  default: '📭',
};

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
  const displayIcon = icon ?? ICONS[variant] ?? ICONS.default;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      <div className="text-5xl mb-4 opacity-80" aria-hidden="true">
        {typeof displayIcon === 'string' ? displayIcon : displayIcon}
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-sm mb-6">{description}</p>
      )}
      {(action || actionLabel || actionHref) && (
        <div className="flex flex-wrap justify-center gap-3">
          {action && (
            <button
              onClick={action}
              className="interactive-button px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg"
            >
              {actionLabel || 'Get started'}
            </button>
          )}
          {actionHref && !action && (
            <a
              href={actionHref}
              className="interactive-button inline-block px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg"
            >
              {actionLabel || 'Get started'}
            </a>
          )}
          {(secondaryAction || secondaryHref) && (
            secondaryAction ? (
              <button
                onClick={secondaryAction}
                className="interactive-button px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg"
              >
                {secondaryLabel || 'Learn more'}
              </button>
            ) : (
              <a
                href={secondaryHref}
                className="interactive-button inline-block px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg"
              >
                {secondaryLabel || 'Learn more'}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
