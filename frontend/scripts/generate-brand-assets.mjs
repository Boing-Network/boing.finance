/**
 * Rasterize public/assets/boing-logo-mark.svg into favicons, PWA icons, OG image, and legacy paths.
 * Requires: sharp (devDependency). Run from frontend/: `npm run generate-brand-assets`
 * Then: `npm run generate-favicon` (uses boing-logo-mark.png as ICO source).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const assetsDir = path.join(publicDir, 'assets');
const svgPath = path.join(assetsDir, 'boing-logo-mark.svg');

async function renderSquare(size, outAbsPath) {
  const buf = fs.readFileSync(svgPath);
  await sharp(buf)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outAbsPath);
  console.log(`[brand-assets] ${path.relative(publicDir, outAbsPath)} (${size}×${size})`);
}

async function buildOgImage() {
  const logoBuf = await sharp(fs.readFileSync(svgPath))
    .resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const b64 = logoBuf.toString('base64');
  const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#121a24"/>
      <stop offset="55%" stop-color="#0c1018"/>
      <stop offset="100%" stop-color="#06080c"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="32%" r="70%">
      <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <image href="data:image/png;base64,${b64}" width="280" height="280" x="460" y="88"/>
  <text x="600" y="440" text-anchor="middle" fill="#e9eef5" font-size="48" font-family="Segoe UI, system-ui, sans-serif" font-weight="700">boing.finance</text>
  <text x="600" y="495" text-anchor="middle" fill="#7eb8ff" font-size="26" font-family="Segoe UI, system-ui, sans-serif">DeFi That Bounces Back</text>
  <text x="600" y="535" text-anchor="middle" fill="#8b9cb0" font-size="18" font-family="Segoe UI, system-ui, sans-serif">Swap · Deploy · Bridge on EVM &amp; Solana</text>
</svg>`;
  const out = path.join(publicDir, 'preview-image.png');
  await sharp(Buffer.from(ogSvg)).png().toFile(out);
  console.log('[brand-assets] preview-image.png (1200×630)');
}

async function buildFacebookBanner() {
  const logoBuf = await sharp(fs.readFileSync(svgPath))
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const b64 = logoBuf.toString('base64');
  const w = 820;
  const h = 312;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#121a24"/>
      <stop offset="100%" stop-color="#06080c"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bbg)"/>
  <image href="data:image/png;base64,${b64}" width="200" height="200" x="48" y="56"/>
  <text x="280" y="130" fill="#e9eef5" font-size="36" font-family="Segoe UI, system-ui, sans-serif" font-weight="700">boing.finance</text>
  <text x="280" y="175" fill="#8b9cb0" font-size="18" font-family="Segoe UI, system-ui, sans-serif">DeFi That Bounces Back</text>
  <text x="280" y="210" fill="#00e5ff" font-size="15" font-family="Segoe UI, system-ui, sans-serif" opacity="0.9">Swap · Deploy · Bridge</text>
</svg>`;
  const out = path.join(assetsDir, 'boing-banner-facebook.png');
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log('[brand-assets] assets/boing-banner-facebook.png (820×312)');
}

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error('[brand-assets] Missing', svgPath);
    process.exit(1);
  }

  await renderSquare(512, path.join(assetsDir, 'boing-logo-mark.png'));
  await renderSquare(512, path.join(publicDir, 'favicon.png'));
  await renderSquare(512, path.join(assetsDir, 'boing-profile-twitter.png'));
  await renderSquare(512, path.join(assetsDir, 'boing-logo-light-mode.png'));
  await renderSquare(512, path.join(assetsDir, 'boing-logo-dark-nebula.png'));
  await renderSquare(400, path.join(assetsDir, 'boing-profile-facebook.png'));
  await renderSquare(256, path.join(assetsDir, 'icon-only-transparent.png'));

  await renderSquare(32, path.join(publicDir, 'favicon-32x32.png'));
  await renderSquare(96, path.join(publicDir, 'favicon-96x96.png'));
  await renderSquare(180, path.join(publicDir, 'apple-touch-icon.png'));
  await renderSquare(150, path.join(publicDir, 'mstile-150x150.png'));

  await buildOgImage();
  await buildFacebookBanner();

  console.log('[brand-assets] Done. Run: npm run generate-favicon');
}

main().catch((e) => {
  console.error('[brand-assets]', e);
  process.exit(1);
});
