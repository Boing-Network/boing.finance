import React from 'react';

/**
 * Theme-colored SVG icons for app navigation (replaces emoji in nav config).
 * iconKey matches navigation.js `icon` field.
 */
export default function NavIcon({ icon, className = '', size = 18 }) {
  const stroke = 'currentColor';
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className: `shrink-0 ${className}`,
  };

  switch (icon) {
    case 'swap':
      return (
        <svg {...common}>
          <path d="M7 7h11M18 7l-3-3M18 7l-3 3" />
          <path d="M17 17H6M6 17l3-3M6 17l3 3" />
        </svg>
      );
    case 'bridge':
      return (
        <svg {...common}>
          <path d="M4 12h16" />
          <path d="M7 8c2-3 8-3 10 0M7 16c2 3 8 3 10 0" />
          <path d="M7 8v8M17 8v8" />
        </svg>
      );
    case 'pools':
      return (
        <svg {...common}>
          <path d="M12 3c-2.5 4-6 6.5-6 10a6 6 0 0012 0c0-3.5-3.5-6-6-10z" />
        </svg>
      );
    case 'tokens':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M9.5 10.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5M9.5 13.5c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5" />
        </svg>
      );
    case 'project-pack':
      return (
        <svg {...common}>
          <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
          <path d="M12 12v8M4 8l8 4 8-4" />
        </svg>
      );
    case 'deploy-token':
      return (
        <svg {...common}>
          <path d="M12 3v10" />
          <path d="M8 7l4-4 4 4" />
          <path d="M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
        </svg>
      );
    case 'create-nft':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M3 15l5-4 4 3 3-2 6 5" />
        </svg>
      );
    case 'manage-links':
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5.93" />
          <path d="M14 11a5 5 0 00-7.07 0L5.5 12.43a5 5 0 007.07 7.07L14 18.07" />
        </svg>
      );
    case 'create-pool':
      return (
        <svg {...common}>
          <circle cx="9" cy="12" r="4" />
          <circle cx="15" cy="12" r="4" />
          <path d="M12 8v8" />
        </svg>
      );
    case 'intelligence':
      return (
        <svg {...common}>
          <path d="M12 3a6 6 0 00-4 10.5V16h8v-2.5A6 6 0 0012 3z" />
          <path d="M10 19h4M11 22h2" />
        </svg>
      );
    case 'portfolio':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      );
    case 'wallet-flow':
      return (
        <svg {...common}>
          <path d="M8 6h10a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
          <path d="M8 6V5a2 2 0 012-2h2M9 11h6M9 15h4" />
        </svg>
      );
    case 'watchlist':
      return (
        <svg {...common}>
          <path d="M12 3l2.2 4.6L19 8.3l-3.5 3.4.8 4.9L12 14.3 7.7 16.6l.8-4.9L5 8.3l4.8-.7L12 3z" />
        </svg>
      );
    case 'proposals':
      return (
        <svg {...common}>
          <path d="M7 3h7l4 4v14H7V3z" />
          <path d="M14 3v4h4M10 12h6M10 16h4" />
        </svg>
      );
    case 'vote':
      return (
        <svg {...common}>
          <path d="M9 11l2 2 4-4" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 'treasury':
      return (
        <svg {...common}>
          <path d="M3 10h18M5 10v8h14v-8M4 10l8-6 8 6M10 14h4" />
        </svg>
      );
    case 'roadmap':
      return (
        <svg {...common}>
          <path d="M9 4v16M15 4v16M4 8h5M15 8h5M4 16h5M15 16h5" />
        </svg>
      );
    case 'community':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3.5 19c1-3 3-4.5 5.5-4.5S14 16 15 19M14 15.5c1.2-.7 2.5-1 3.8-.7 1.8.4 3.2 1.8 3.7 3.2" />
        </svg>
      );
    case 'learn':
      return (
        <svg {...common}>
          <path d="M4 5h7a3 3 0 013 3v11a2.5 2.5 0 00-2.5-2.5H4V5z" />
          <path d="M20 5h-7a3 3 0 00-3 3v11a2.5 2.5 0 012.5-2.5H20V5z" />
        </svg>
      );
    case 'staking':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      );
    case 'points':
      return (
        <svg {...common}>
          <path d="M12 3l2.2 4.6L19 8.3l-3.5 3.4.8 4.9L12 14.3 7.7 16.6l.8-4.9L5 8.3l4.8-.7L12 3z" />
        </svg>
      );
    case 'activities':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'native-vm':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
