// Sitemap Generator Utility
// Generates sitemap.xml for SEO

const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/deploy-token', priority: '0.9', changefreq: 'weekly' },
  { path: '/tokens', priority: '0.9', changefreq: 'daily' },
  { path: '/portfolio', priority: '0.8', changefreq: 'daily' },
  { path: '/analytics', priority: '0.8', changefreq: 'daily' },
  { path: '/pools', priority: '0.8', changefreq: 'daily' },
  { path: '/swap', priority: '0.7', changefreq: 'weekly' },
  { path: '/liquidity', priority: '0.7', changefreq: 'weekly' },
  { path: '/bridge', priority: '0.7', changefreq: 'weekly' },
  { path: '/create-pool', priority: '0.7', changefreq: 'weekly' },
  { path: '/docs', priority: '0.6', changefreq: 'monthly' },
  { path: '/help-center', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact-us', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms', priority: '0.4', changefreq: 'yearly' },
  { path: '/whitepaper', priority: '0.5', changefreq: 'monthly' },
];

const baseUrl = 'https://boing.finance';

export const generateSitemap = () => {
  const urls = routes.map((route) => {
    return `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
};

export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
};

