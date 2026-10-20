/**
 * OpenSea-style CSV helpers for large NFT collections.
 *
 * Columns:
 * - filename (preferred) or file_name — basename matched to uploaded media
 * - name, description (optional; defaults applied)
 * - image — optional public URL (used when no local file match)
 * - external_url — optional
 * - any other header → attributes[{ trait_type, value }]
 */

import { NFT_LARGE_SET_MAX_ROWS } from '../config/nftUploadLimits';
import { publicAssetUri } from './nftCollectionMetadata';

export const NFT_CSV_TEMPLATE_PATH = '/templates/nft-collection-metadata.csv';

export const NFT_CSV_TEMPLATE_HEADER =
  'filename,name,description,external_url,Background,Eyes,Rarity';

export const NFT_CSV_TEMPLATE_BODY = [
  '1.png,Cool Ape #1,First in the set,,Blue,Laser,Legendary',
  '2.png,Cool Ape #2,Second in the set,,Red,Sleepy,Common',
  '3.png,Cool Ape #3,Third in the set,,Green,Wink,Rare',
].join('\n');

export function buildNftCsvTemplateText() {
  return `${NFT_CSV_TEMPLATE_HEADER}\n${NFT_CSV_TEMPLATE_BODY}\n`;
}

export function downloadNftCsvTemplate(filename = 'boing-nft-collection-template.csv') {
  const blob = new Blob([buildNftCsvTemplateText()], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** RFC-style CSV line split (handles quotes; does not invent empty cells between commas). */
function splitCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  const row = String(line || '');
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"') {
        if (row[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function basename(pathLike) {
  const s = String(pathLike || '').trim().replace(/\\/g, '/');
  if (!s) return '';
  const parts = s.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * @returns {{ tokens: object[], filenames: string[], warnings: string[] }}
 */
export function parseNftMetadataCsv(text, maxRows = NFT_LARGE_SET_MAX_ROWS) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) {
    return { tokens: [], filenames: [], warnings: ['CSV needs a header row and at least one data row.'] };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const nameCol = headers.findIndex((h) => /^name$/i.test(h));
  const descCol = headers.findIndex((h) => /^description$/i.test(h));
  const imageCol = headers.findIndex((h) => /^image$/i.test(h));
  const externalCol = headers.findIndex((h) => /^external_url$/i.test(h));
  const fileCol = headers.findIndex((h) => /^(filename|file_name|file)$/i.test(h));

  const tokens = [];
  const filenames = [];
  const warnings = [];

  for (let r = 1; r < lines.length && tokens.length < maxRows; r++) {
    const cells = splitCsvLine(lines[r]);
    const name = nameCol >= 0 && cells[nameCol] ? cells[nameCol] : `Token #${r}`;
    const description = descCol >= 0 && cells[descCol] ? cells[descCol] : '';
    const external_url = externalCol >= 0 && cells[externalCol] ? cells[externalCol] : '';
    const fileHint = fileCol >= 0 && cells[fileCol] ? basename(cells[fileCol]) : '';
    const imageRaw = imageCol >= 0 && cells[imageCol] ? cells[imageCol] : '';
    const imageUri = imageRaw ? publicAssetUri(imageRaw) : '';

    const attributes = [];
    headers.forEach((h, i) => {
      if (i === nameCol || i === descCol || i === imageCol || i === externalCol || i === fileCol) return;
      const value = cells[i];
      if (value != null && value !== '') attributes.push({ trait_type: h, value });
    });

    if (fileHint) filenames.push(fileHint);

    tokens.push({
      name,
      description: description || '',
      image: imageUri || '',
      external_url: external_url || '',
      attributes,
      _filename: fileHint,
    });
  }

  if (lines.length - 1 > maxRows) {
    warnings.push(`CSV truncated to ${maxRows} rows.`);
  }
  if (fileCol < 0 && imageCol < 0) {
    warnings.push('No filename or image column — add filename to match media uploads, or image URLs.');
  }

  return { tokens, filenames, warnings };
}

/** Map basename → File from a FileList / array (folder uploads include webkitRelativePath). */
export function indexMediaFilesByBasename(fileList) {
  const map = new Map();
  for (const file of Array.from(fileList || [])) {
    if (!file || !file.name) continue;
    const base = basename(file.name);
    if (!base) continue;
    if (!map.has(base.toLowerCase())) {
      map.set(base.toLowerCase(), file);
    }
  }
  return map;
}

/**
 * Attach public image URIs onto token metadata by matching `_filename` / basename.
 * @param {object[]} tokens
 * @param {Record<string, string>} uriByFilenameLower — basename(lower) → public URL
 */
export function applyMediaUrisToTokens(tokens, uriByFilenameLower) {
  return (tokens || []).map((token) => {
    const key = String(token._filename || '').toLowerCase();
    const matched = key && uriByFilenameLower[key] ? uriByFilenameLower[key] : '';
    const image = matched || token.image || '';
    const { _filename, ...rest } = token;
    return { ...rest, image, _filename: token._filename || '' };
  });
}

export function mediaMatchReport(tokens, fileMap) {
  const needed = [];
  const missing = [];
  const unused = [];
  const seen = new Set();

  for (const t of tokens || []) {
    const fn = String(t._filename || '').trim();
    if (!fn) continue;
    const key = fn.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    needed.push(fn);
    if (!fileMap.has(key) && !t.image) missing.push(fn);
  }

  for (const [key, file] of fileMap.entries()) {
    if (!seen.has(key)) unused.push(file.name);
  }

  return { needed, missing, unused };
}
