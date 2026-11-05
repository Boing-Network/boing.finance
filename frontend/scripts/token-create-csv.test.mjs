import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseTokenCreateCsv,
  splitCsvRows,
  TOKEN_CREATE_CSV_MAX_ROWS,
  TOKEN_CREATE_CSV_TEMPLATE,
} from '../src/utils/tokenCreateCsv.js';

test('splitCsvRows handles quoted commas', () => {
  const rows = splitCsvRows('name,symbol,supply\n"Cool, Token",COOL,100\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ['Cool, Token', 'COOL', '100']);
});

test('parseTokenCreateCsv accepts aliases and normalizes', () => {
  const { rows, errors } = parseTokenCreateCsv(
    'token_name,ticker,initial_supply\nAlpha,alp,1_000\nBeta,BET,50\n'
  );
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].symbol, 'ALP');
  assert.equal(rows[0].supply, '1000');
  assert.equal(rows[1].name, 'Beta');
});

test('parseTokenCreateCsv rejects missing columns and bad supply', () => {
  const missing = parseTokenCreateCsv('a,b\n1,2\n');
  assert.ok(missing.errors[0].includes('name, symbol, and supply'));
  const bad = parseTokenCreateCsv('name,symbol,supply\nX,Y,nope\n');
  assert.ok(bad.errors.some((e) => /supply|whole/i.test(e)));
});

test('parseTokenCreateCsv caps Large set rows', () => {
  const lines = ['name,symbol,supply'];
  for (let i = 0; i < TOKEN_CREATE_CSV_MAX_ROWS + 5; i += 1) {
    lines.push(`T${i},T${i},${i + 1}`);
  }
  const { rows, warnings } = parseTokenCreateCsv(lines.join('\n'));
  assert.equal(rows.length, TOKEN_CREATE_CSV_MAX_ROWS);
  assert.ok(warnings[0].includes(String(TOKEN_CREATE_CSV_MAX_ROWS)));
});

test('template parses cleanly', () => {
  const { rows, errors } = parseTokenCreateCsv(TOKEN_CREATE_CSV_TEMPLATE);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 2);
});
