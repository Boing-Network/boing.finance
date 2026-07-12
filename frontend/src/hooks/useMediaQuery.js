import { useState, useEffect } from 'react';
import { BREAKPOINTS, MEDIA_QUERIES } from '../constants/breakpoints';

function resolveQuery(query) {
  if (typeof query === 'string' && query.startsWith('(')) return query;
  if (typeof query === 'string' && MEDIA_QUERIES[query]) return MEDIA_QUERIES[query];
  if (typeof query === 'number') return `(min-width: ${query}px)`;
  return query;
}

function getMatch(query) {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(resolveQuery(query)).matches;
}

/**
 * Subscribe to a CSS media query. Pass a MEDIA_QUERIES key, raw query string, or min-width px number.
 * @param {string | number} query
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const resolved = resolveQuery(query);

  const [matches, setMatches] = useState(() => getMatch(resolved));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(resolved);
    const handleChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [resolved]);

  return matches;
}

/**
 * Named breakpoint flags for app nav + responsive data views.
 * Only subscribes to md / lg / navDesktop (3 listeners).
 * Use `useMediaQuery` directly for other breakpoints.
 *
 * @returns {{
 *   md: boolean,
 *   lg: boolean,
 *   navDesktop: boolean,
 *   isMobileNav: boolean,
 *   isMediumNav: boolean,
 *   isDesktopNav: boolean,
 *   isTableLayout: boolean,
 * }}
 */
export function useBreakpoint() {
  const md = useMediaQuery('md');
  const lg = useMediaQuery('lg');
  const navDesktop = useMediaQuery('navDesktop');

  return {
    md,
    lg,
    navDesktop,
    /** Hamburger sheet (< md) */
    isMobileNav: !md,
    /** Compact header + hamburger (md – navDesktop) */
    isMediumNav: md && !navDesktop,
    /** Full inline nav (≥ navDesktop) */
    isDesktopNav: navDesktop,
    /** Prefer table over card list (≥ lg) */
    isTableLayout: lg,
  };
}

export { BREAKPOINTS, MEDIA_QUERIES };
