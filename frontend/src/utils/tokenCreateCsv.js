/**
 * CSV helpers for Create Token → Large set.
 * Required columns: name, symbol, supply (aliases accepted).
 */

/** Soft product cap — each row is its own Express signature. */
export const TOKEN_CREATE_CSV_MAX_ROWS = 50;
const U128_MAX = (1n << 128n) - 1n;

/** Lightweight supply check (authoritative parse still runs at deploy). */
function assertWholeSupply(raw) {
  const s = String(raw ?? '').trim().replace(/[_,\s]/g, '');
  if (!s) throw new Error('Enter an initial supply.');
  if (!/^\d+$/.test(s)) throw new Error('Initial supply must be a whole number (Boing tokens have no decimals).');
  const v = BigInt(s);
  if (v <= 0n) throw new Error('Initial supply must be greater than 0.');
  if (v > U128_MAX) throw new Error('Initial supply is too large (max 2^128 - 1).');
  return s;
}

const NAME_KEYS = new Set(['name', 'token_name', 'tokenname']);
const SYMBOL_KEYS = new Set(['symbol', 'ticker', 'token_symbol', 'tokensymbol']);
const SUPPLY_KEYS = new Set(['supply', 'initial_supply', 'amount', 'total_supply']);

/**
 * Minimal RFC4180-ish CSV split (handles quoted fields with commas).
 * @param {string} text
 * @returns {string[][]}
 */
export function splitCsvRows(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  return rows;
}

function normHeader(h) {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function pickCol(headers, keys) {
  for (let i = 0; i < headers.length; i += 1) {
    if (keys.has(headers[i])) return i;
  }
  return -1;
}

/**
 * @param {string} text
 * @returns {{
 *   rows: Array<{ name: string, symbol: string, supply: string }>,
 *   errors: string[],
 *   warnings: string[],
 * }}
 */
export function parseTokenCreateCsv(text) {
  const matrix = splitCsvRows(text);
  const errors = [];
  const warnings = [];
  if (matrix.length < 2) {
    return { rows: [], errors: ['CSV needs a header row and at least one token row.'], warnings };
  }
  const headers = matrix[0].map(normHeader);
  const nameIdx = pickCol(headers, NAME_KEYS);
  const symbolIdx = pickCol(headers, SYMBOL_KEYS);
  const supplyIdx = pickCol(headers, SUPPLY_KEYS);
  if (nameIdx < 0 || symbolIdx < 0 || supplyIdx < 0) {
    return {
      rows: [],
      errors: ['CSV header must include name, symbol, and supply columns.'],
      warnings,
    };
  }

  const rows = [];
  for (let r = 1; r < matrix.length; r += 1) {
    const line = matrix[r];
    const name = String(line[nameIdx] ?? '').trim();
    const symbol = String(line[symbolIdx] ?? '').trim().toUpperCase();
    const supplyRaw = String(line[supplyIdx] ?? '').trim();
    if (!name && !symbol && !supplyRaw) continue;
    if (!name || !symbol || !supplyRaw) {
      errors.push(`Row ${r + 1}: name, symbol, and supply are required.`);
      continue;
    }
    let supply;
    try {
      supply = assertWholeSupply(supplyRaw);
    } catch (e) {
      errors.push(`Row ${r + 1}: ${e?.message || 'invalid supply'}`);
      continue;
    }
    if (symbol.length > 32) {
      errors.push(`Row ${r + 1}: symbol is too long (max 32).`);
      continue;
    }
    rows.push({ name, symbol, supply });
  }

  if (rows.length > TOKEN_CREATE_CSV_MAX_ROWS) {
    warnings.push(
      `Only the first ${TOKEN_CREATE_CSV_MAX_ROWS} rows will be created (each needs its own wallet approval).`
    );
    return {
      rows: rows.slice(0, TOKEN_CREATE_CSV_MAX_ROWS),
      errors,
      warnings,
    };
  }
  if (rows.length === 0 && errors.length === 0) {
    errors.push('No token rows found after the header.');
  }
  return { rows, errors, warnings };
}

export const TOKEN_CREATE_CSV_TEMPLATE = `name,symbol,supply
Demo Token,DEMO,1000000
Second Token,SEC,500000
`;
