/**
 * Build public/favicon.ico from the canonical mark PNG (generated from boing-logo-mark.svg).
 * Renders multiple square PNG layers (default 16–128px) with sharp, then packs them into a PNG-layer ICO (no extra dependency).
 *
 * Usage: npm run generate-favicon
 * Prerequisite: npm run generate-brand-assets (creates assets/boing-logo-mark.png)
 * Optional: FAVICON_SOURCE=/path/to.png node scripts/generate-favicon.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

/** Pack PNG buffers into an ICO container (PNG-compressed entries, supported since Windows Vista). */
function packIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach((png, i) => {
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    const o = i * 16;
    dir.writeUInt8(w >= 256 ? 0 : w, o);
    dir.writeUInt8(h >= 256 ? 0 : h, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  return Buffer.concat([header, dir, ...pngs]);
}

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

  const icoBuffer = packIco(pngBuffers);

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
