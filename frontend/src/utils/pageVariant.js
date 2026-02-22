/**
 * Route → page color variant for Deep Trade (per-page accent emphasis).
 * Used by App.js to apply page-variant-* class to the root wrapper.
 */
export function getPageVariant(pathname) {
  if (pathname === '/') return 'landing';
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/governance')) return 'governance';
  if (pathname.startsWith('/boing')) return 'boing';
  if (pathname.startsWith('/docs') || pathname.startsWith('/blog') || pathname.startsWith('/help-center') || pathname.startsWith('/contact-us') || pathname.startsWith('/whitepaper') || pathname.startsWith('/terms') || pathname.startsWith('/privacy') || pathname.startsWith('/executive-summary') || pathname.startsWith('/status') || pathname.startsWith('/bug-report')) return 'docs';
  return 'trade';
}
