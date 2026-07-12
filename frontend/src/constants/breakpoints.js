/**
 * Shared viewport breakpoints for JS media queries.
 * Tailwind defaults (sm–2xl) plus app-specific nav and stat-grid tiers.
 */
export const BREAKPOINTS = {
  /** Minimum width for comfortable 2-column stat grids on phones */
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  /** Full desktop nav (wallet + links inline) */
  navDesktop: 1150,
  /** Toolbar button rows (Tokens page actions) */
  compact: 400,
  /** Inline filter rows (Analytics trending filters) */
  filter: 480,
};

/** @type {Record<string, string>} */
export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  navDesktop: `(min-width: ${BREAKPOINTS.navDesktop}px)`,
  compact: `(min-width: ${BREAKPOINTS.compact}px)`,
  filter: `(min-width: ${BREAKPOINTS.filter}px)`,
  maxSm: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  maxMd: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  maxLg: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  maxNavDesktop: `(max-width: ${BREAKPOINTS.navDesktop - 1}px)`,
};
