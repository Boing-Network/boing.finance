// Cold-load JS/CSS bytes per route against `vite preview` (node scripts/measure-first-load.mjs [baseUrl]).
import { chromium } from 'playwright';
import zlib from 'node:zlib';
const base = process.argv[2] || 'http://localhost:4173';
const routes = (process.env.ROUTES || '/,/swap,/deploy-token,/analytics,/pools').split(',');
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'msedge' }));
const out = {};
for (const r of routes) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const files = new Map();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('response', async (res) => {
    const u = res.url();
    if (!u.startsWith(base) || !/\.(js|css)(\?|$)/.test(u)) return;
    try { const b = await res.body(); files.set(u, b); } catch {}
  });
  await page.goto(base + r, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  let raw = 0, gz = 0, js = 0, jsGz = 0;
  for (const [u, b] of files) {
    const g = zlib.gzipSync(b).length;
    raw += b.length; gz += g;
    if (/\.js(\?|$)/.test(u)) { js += b.length; jsGz += g; }
  }
  out[r] = { files: files.size, jsKB: +(js / 1024).toFixed(1), jsGzKB: +(jsGz / 1024).toFixed(1), totalKB: +(raw / 1024).toFixed(1), totalGzKB: +(gz / 1024).toFixed(1), // Cross-origin API calls fail from localhost (CORS); count them separately from real errors.
    corsOrNetworkErrors: errors.filter((e) => /CORS|ERR_FAILED|Failed to fetch|Error fetching/.test(e)).length,
    errors: errors.filter((e) => !/CORS|ERR_FAILED|Failed to fetch|Error fetching/.test(e)).slice(0, 5),
    largest: [...files].filter(([u]) => u.endsWith('.js')).sort((a, b) => b[1].length - a[1].length).slice(0, 6).map(([u, b]) => `${u.split('/').pop()} ${(b.length / 1024).toFixed(0)}KB`) };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));