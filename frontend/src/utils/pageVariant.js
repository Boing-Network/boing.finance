/**
 * Route → page color variant for Deep Trade (per-page accent emphasis).
 * Used by App.jsx to apply page-variant-* class to the root wrapper.
 */
export function getPageVariant(pathname) {
  if (pathname === '/') return 'landing';
  if (pathname.startsWith('/portfolio') || pathname.startsWith('/staking')) return 'portfolio';
  if (pathname.startsWith('/boing')) return 'boing';
  if (pathname.startsWith('/docs') || pathname.startsWith('/help-center') || pathname.startsWith('/contact-us') || pathname.startsWith('/terms') || pathname.startsWith('/privacy') || pathname.startsWith('/status') || pathname.startsWith('/bug-report')) return 'docs';
  return 'trade';
}
