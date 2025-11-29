// Sitemap Generator Utility
// Generates dynamic sitemap.xml for SEO

const BASE_URL = 'https://boing.finance';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/deploy-token', priority: '0.9', changefreq: 'weekly' },
  { path: '/tokens', priority: '0.8', changefreq: 'daily' },
  { path: '/portfolio', priority: '0.7', changefreq: 'weekly' },
  { path: '/analytics', priority: '0.7', changefreq: 'daily' },
  { path: '/developer-tools', priority: '0.6', changefreq: 'weekly' },
  { path: '/docs', priority: '0.6', changefreq: 'weekly' },
  { path: '/help-center', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' }
];

/**
 * Generate sitemap XML
 */
export const generateSitemap = (additionalRoutes = []) => {
  const routes = [...STATIC_ROUTES, ...additionalRoutes];
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = routes.map(route => {
    const lastmodDate = route.lastmod || lastmod;
    return `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
};

/**
 * Generate sitemap for token pages (if needed)
 */
export const generateTokenSitemap = (tokens = []) => {
  const lastmod = new Date().toISOString().split('T')[0];
  
  const tokenUrls = tokens.map(token => {
    return `  <url>
    <loc>${BASE_URL}/tokens/${token.address}?network=${token.chainId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tokenUrls}
</urlset>`;
};
