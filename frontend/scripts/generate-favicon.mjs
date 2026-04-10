/**
 * Build public/favicon.ico from the canonical mark PNG (generated from boing-logo-mark.svg).
 * Renders multiple square PNG layers (default 16–128px) with sharp, then packs them with to-ico.
 *
 * Usage: npm run generate-favicon
 * Prerequisite: npm run generate-brand-assets (creates assets/boing-logo-mark.png)
 * Optional: FAVICON_SOURCE=/path/to.png node scripts/generate-favicon.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const toIco = require('to-ico');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const DEFAULT_SOURCE = path.join(publicDir, 'assets', 'boing-logo-mark.png');
const SOURCE = process.env.FAVICON_SOURCE
  ? path.resolve(process.env.FAVICON_SOURCE)
  : DEFAULT_SOURCE;

const OUT_ICO = path.join(publicDir, 'favicon.ico');
const OUT_ICO_ALT = path.join(publicDir, 'favicon-alt.ico');

/** Match generate-brand-assets favicon PNGs (solid #06080c) so ICO layers are not transparent 8‑bit mush in tabs. */
const FAVICON_TILE_BG = { r: 6, g: 8, b: 12, alpha: 1 };

/** Embedded PNG layers (Vista+ ICO). 256px omitted to keep favicon.ico lightweight; PNG favicons cover HD. */
const ICO_SIZES = [16, 24, 32, 48, 64, 128];

async function pngForSize(inputPath, size) {
  return sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: FAVICON_TILE_BG,
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

async function buildIco() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`[generate-favicon] Source image not found: ${SOURCE}`);
    process.exit(1);
  }

  const pngBuffers = await Promise.all(
    ICO_SIZES.map((size) => pngForSize(SOURCE, size)),
  );

  const icoBuffer = await toIco(pngBuffers);

  fs.writeFileSync(OUT_ICO, icoBuffer);
  fs.writeFileSync(OUT_ICO_ALT, icoBuffer);
  console.log(
    `[generate-favicon] Wrote ${OUT_ICO} and ${OUT_ICO_ALT} (${ICO_SIZES.join(', ')} px) from ${path.relative(process.cwd(), SOURCE)}`,
  );
}

buildIco().catch((err) => {
  console.error('[generate-favicon]', err);
  process.exit(1);
});
