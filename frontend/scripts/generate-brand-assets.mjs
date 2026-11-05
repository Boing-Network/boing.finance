/**
 * Rasterize public/assets/boing-logo-mark.svg into favicons, PWA icons, OG image, and legacy paths.
 * OG card uses public/assets/boing-finance-wordmark.svg (mark + Comfortaa "Boing Finance") on navy #050A1A —
 * same family layout as boing.network / boing.express / boing.observer.
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
const wordmarkPath = path.join(assetsDir, 'boing-finance-wordmark.svg');

/** Solid tile behind small favicons — transparent + ICO quantization often reads as broken / “green” in tabs. */
const FAVICON_TILE_BG = { r: 5, g: 10, b: 26, alpha: 1 };
const BRAND_RGB = { r: 5, g: 10, b: 26 };
const PNG = { compressionLevel: 9 };

/**
 * @param {number} size
 * @param {string} outAbsPath
 * @param {{ r: number, g: number, b: number, alpha: number }} [background] — default transparent; use FAVICON_TILE_BG for tab icons.
 */
async function renderSquare(size, outAbsPath, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  const buf = fs.readFileSync(svgPath);
  await sharp(buf)
    .resize(size, size, { fit: 'contain', background })
    .png(PNG)
    .toFile(outAbsPath);
  console.log(`[brand-assets] ${path.relative(publicDir, outAbsPath)} (${size}×${size})`);
}

/** Tab + PWA: keep in sync with canonical mark (avoids drift from hand-edited public/favicon.svg). */
function copySvgFavicon() {
  const out = path.join(publicDir, 'favicon.svg');
  fs.copyFileSync(svgPath, out);
  console.log('[brand-assets] favicon.svg (copy of assets/boing-logo-mark.svg)');
}

/** Base / Farcaster miniapp `splashImageUrl` — was missing from public/, caused broken image links. */
async function buildSplash() {
  const buf = fs.readFileSync(svgPath);
  const logo = await sharp(buf)
    .resize(220, 220, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const out = path.join(publicDir, 'splash.png');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 10, b: 26, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png(PNG)
    .toFile(out);
  console.log('[brand-assets] splash.png (512×512, boing-logo-mark on #050A1A)');
}

function ogTaglineSvg() {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="120" viewBox="0 0 760 120">
  <text x="0" y="40" fill="#94a3b8" font-family="Comfortaa,Segoe UI,system-ui,sans-serif" font-size="30">The DEX for Boing Network</text>
  <text x="0" y="92" fill="#64748b" font-family="Comfortaa,Segoe UI,system-ui,sans-serif" font-size="24">boing.finance · Public testnet, mainnet not live</text>
</svg>`,
    'utf8',
  );
}

/**
 * 1200×630: outlined wordmark (mark + Comfortaa Bold paths) with tagline under the text.
 * Matches network / express / observer family share cards.
 */
async function buildOgImage() {
  if (!fs.existsSync(wordmarkPath)) {
    throw new Error(`Missing wordmark: ${wordmarkPath}`);
  }
  const wordmarkSvg = fs.readFileSync(wordmarkPath);
  const W = 1200;
  const H = 630;
  const wmWidth = 900;
  const wm = await sharp(wordmarkSvg, { density: 900 }).resize({ width: wmWidth }).png().toBuffer();
  const { height: wmHeight } = await sharp(wm).metadata();
  const tag = await sharp(ogTaglineSvg()).png().toBuffer();
  const left = Math.round((W - wmWidth) / 2);
  const top = Math.round(H / 2 - wmHeight / 2 - 50);
  // text starts at x=76 of the wordmark viewBox (width ~250)
  const textLeft = left + Math.round(wmWidth * (76 / 250));
  const buffer = await sharp({ create: { width: W, height: H, channels: 3, background: BRAND_RGB } })
    .composite([
      { input: wm, left, top },
      { input: tag, left: textLeft, top: top + wmHeight + 8 },
    ])
    .png(PNG)
    .toBuffer();

  const previewOut = path.join(publicDir, 'preview-image.png');
  const ogOut = path.join(publicDir, 'og.png');
  const ogImageOut = path.join(publicDir, 'og-image.png');
  await fs.promises.writeFile(previewOut, buffer);
  await fs.promises.writeFile(ogOut, buffer);
  await fs.promises.writeFile(ogImageOut, buffer);
  console.log('[brand-assets] preview-image.png / og.png / og-image.png (1200×630, family wordmark card)');
}

async function buildHeroImage() {
  if (!fs.existsSync(wordmarkPath)) {
    throw new Error(`Missing wordmark: ${wordmarkPath}`);
  }
  const wordmarkSvg = fs.readFileSync(wordmarkPath);
  const W = 1024;
  const H = 682;
  const wmWidth = 720;
  const wm = await sharp(wordmarkSvg, { density: 900 }).resize({ width: wmWidth }).png().toBuffer();
  const { height: wmHeight } = await sharp(wm).metadata();
  const tag = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="100" viewBox="0 0 700 100">
  <text x="0" y="36" fill="#94a3b8" font-family="Comfortaa,Segoe UI,system-ui,sans-serif" font-size="28">The DEX for Boing Network</text>
  <text x="0" y="78" fill="#64748b" font-family="Comfortaa,Segoe UI,system-ui,sans-serif" font-size="20">boing.finance · Public testnet, mainnet not live</text>
</svg>`,
      'utf8',
    ),
  )
    .png()
    .toBuffer();
  const left = Math.round((W - wmWidth) / 2);
  const top = Math.round(H / 2 - wmHeight / 2 - 40);
  const textLeft = left + Math.round(wmWidth * (76 / 250));
  await sharp({ create: { width: W, height: H, channels: 3, background: BRAND_RGB } })
    .composite([
      { input: wm, left, top },
      { input: tag, left: textLeft, top: top + wmHeight + 8 },
    ])
    .png(PNG)
    .toFile(path.join(publicDir, 'hero-image.png'));
  console.log('[brand-assets] hero-image.png (1024×682)');
}

async function buildFacebookBanner() {
  if (!fs.existsSync(wordmarkPath)) {
    throw new Error(`Missing wordmark: ${wordmarkPath}`);
  }
  const wordmarkSvg = fs.readFileSync(wordmarkPath);
  const w = 820;
  const h = 312;
  const wmWidth = 560;
  const wm = await sharp(wordmarkSvg, { density: 900 }).resize({ width: wmWidth }).png().toBuffer();
  const { height: wmHeight } = await sharp(wm).metadata();
  const tag = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="48" viewBox="0 0 520 48">
  <text x="0" y="32" fill="#94a3b8" font-family="Comfortaa,Segoe UI,system-ui,sans-serif" font-size="20">The DEX for Boing Network · Public testnet</text>
</svg>`,
      'utf8',
    ),
  )
    .png()
    .toBuffer();
  const left = Math.round((w - wmWidth) / 2);
  const top = Math.round(h / 2 - wmHeight / 2 - 18);
  const textLeft = left + Math.round(wmWidth * (76 / 250));
  await sharp({ create: { width: w, height: h, channels: 3, background: BRAND_RGB } })
    .composite([
      { input: wm, left, top },
      { input: tag, left: textLeft, top: top + wmHeight + 4 },
    ])
    .png(PNG)
    .toFile(path.join(assetsDir, 'boing-banner-facebook.png'));
  console.log('[brand-assets] assets/boing-banner-facebook.png (820×312)');
}

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error('[brand-assets] Missing', svgPath);
    process.exit(1);
  }
  if (!fs.existsSync(wordmarkPath)) {
    console.error('[brand-assets] Missing', wordmarkPath);
    process.exit(1);
  }

  await renderSquare(512, path.join(assetsDir, 'boing-logo-mark.png'));
  await renderSquare(512, path.join(publicDir, 'favicon.png'), FAVICON_TILE_BG);
  await renderSquare(512, path.join(assetsDir, 'boing-profile-twitter.png'));
  await renderSquare(512, path.join(assetsDir, 'boing-logo-light-mode.png'));
  await renderSquare(512, path.join(assetsDir, 'boing-logo-dark-nebula.png'));
  await renderSquare(400, path.join(assetsDir, 'boing-profile-facebook.png'));
  await renderSquare(256, path.join(assetsDir, 'icon-only-transparent.png'));

  await renderSquare(16, path.join(publicDir, 'favicon-16x16.png'), FAVICON_TILE_BG);
  await renderSquare(32, path.join(publicDir, 'favicon-32x32.png'), FAVICON_TILE_BG);
  await renderSquare(96, path.join(publicDir, 'favicon-96x96.png'), FAVICON_TILE_BG);
  await renderSquare(180, path.join(publicDir, 'apple-touch-icon.png'), FAVICON_TILE_BG);
  await renderSquare(150, path.join(publicDir, 'mstile-150x150.png'), FAVICON_TILE_BG);
  await renderSquare(192, path.join(publicDir, 'web-app-manifest-192x192.png'), FAVICON_TILE_BG);
  await renderSquare(512, path.join(publicDir, 'web-app-manifest-512x512.png'), FAVICON_TILE_BG);

  copySvgFavicon();
  await buildSplash();
  await buildOgImage();
  await buildHeroImage();
  await buildFacebookBanner();

  console.log('[brand-assets] Done. Run: npm run generate-favicon');
}

main().catch((e) => {
  console.error('[brand-assets]', e);
  process.exit(1);
});
