import test from 'node:test';
import assert from 'node:assert/strict';
import {
  feeForGasLedger,
  formatNativeLedger,
  ledgerDecimalsAt,
  parseBoingToLedger,
} from '../src/utils/boingNativeAmount.js';

test('ledger decimals follow the testnet switch at 1050', () => {
  const info = { decimals: 18, base_unit_decimals: 18, base_units_from_height: 1050 };
  assert.equal(ledgerDecimalsAt(info, 1049), 0);
  assert.equal(ledgerDecimalsAt(info, 1050), 18);
  assert.equal(ledgerDecimalsAt({ decimals: 0 }, 9999), 0);
  assert.equal(ledgerDecimalsAt({ base_units_from_height: null }, 1), 18);
  assert.equal(ledgerDecimalsAt(null, 1), 0);
});

test('format and parse native BOING', () => {
  assert.equal(formatNativeLedger('20', 0), '20');
  assert.equal(formatNativeLedger('1234500000000000000000', 18), '1,234.5');
  assert.equal(formatNativeLedger('1', 18), '<0.000001');
  assert.equal(parseBoingToLedger('100', 0), '100');
  assert.equal(parseBoingToLedger('1.5', 0), null);
  assert.equal(parseBoingToLedger('1.5', 18), '1500000000000000000');
  assert.equal(parseBoingToLedger('0.021', 18), '21000000000000000');
  assert.equal(parseBoingToLedger('abc', 18), null);
});

test('fees: whole-BOING rule before, 10^12 base units per gas after', () => {
  assert.equal(feeForGasLedger(21000, 0), 1n);
  assert.equal(feeForGasLedger(21001, 0), 2n);
  assert.equal(formatNativeLedger(feeForGasLedger(21000, 18).toString(), 18), '0.021');
});
