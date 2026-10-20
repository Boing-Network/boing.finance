import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Lightweight re-implementation of parse helpers for Node (no React env).
// Mirrors frontend/src/utils/nftCsv.js column rules.

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

function parseNftMetadataCsv(text, maxRows = 10000) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return { tokens: [], filenames: [], warnings: ['empty'] };
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const nameCol = headers.findIndex((h) => /^name$/i.test(h));
  const descCol = headers.findIndex((h) => /^description$/i.test(h));
  const imageCol = headers.findIndex((h) => /^image$/i.test(h));
  const externalCol = headers.findIndex((h) => /^external_url$/i.test(h));
  const fileCol = headers.findIndex((h) => /^(filename|file_name|file)$/i.test(h));
  const tokens = [];
  const filenames = [];
  for (let r = 1; r < lines.length && tokens.length < maxRows; r++) {
    const cells = splitCsvLine(lines[r]);
    const name = nameCol >= 0 && cells[nameCol] ? cells[nameCol] : `Token #${r}`;
    const description = descCol >= 0 && cells[descCol] ? cells[descCol] : '';
    const external_url = externalCol >= 0 && cells[externalCol] ? cells[externalCol] : '';
    const fileHint = fileCol >= 0 && cells[fileCol] ? basename(cells[fileCol]) : '';
    const attributes = [];
    headers.forEach((h, i) => {
      if (i === nameCol || i === descCol || i === imageCol || i === externalCol || i === fileCol) return;
      const value = cells[i];
      if (value != null && value !== '') attributes.push({ trait_type: h, value });
    });
    if (fileHint) filenames.push(fileHint);
    tokens.push({ name, description, external_url, attributes, _filename: fileHint });
  }
  return { tokens, filenames };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../public/templates/nft-collection-metadata.csv');

test('CSV template parses with filename + trait columns', () => {
  const text = readFileSync(templatePath, 'utf8');
  const { tokens, filenames } = parseNftMetadataCsv(text);
  assert.equal(tokens.length, 3);
  assert.deepEqual(filenames, ['1.png', '2.png', '3.png']);
  assert.equal(tokens[0].name, 'Cool Ape #1');
  assert.equal(tokens[0]._filename, '1.png');
  assert.ok(tokens[0].attributes.some((a) => a.trait_type === 'Background' && a.value === 'Blue'));
  assert.ok(tokens[0].attributes.some((a) => a.trait_type === 'Rarity' && a.value === 'Legendary'));
});

test('file_name alias and quoted commas', () => {
  const text = `file_name,name,description,Mood\n"path/x.png","Hello, world","A ""quote""",Happy\n`;
  const { tokens } = parseNftMetadataCsv(text);
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0]._filename, 'x.png');
  assert.equal(tokens[0].name, 'Hello, world');
  assert.equal(tokens[0].description, 'A "quote"');
  assert.equal(tokens[0].attributes[0].value, 'Happy');
});
