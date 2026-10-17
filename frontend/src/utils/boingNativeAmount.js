/**
 * Native BOING amounts on Boing L1 (chain 6913). BOING has 18 decimals: 1 BOING = 10^18 base units
 * (boing.network `docs/NATIVE-DENOMINATION.md`). Nodes return native amounts in **ledger units**: base
 * units from the 18-decimals switch (testnet 6913: block 1050; chains without history: genesis), whole
 * BOING before it. `boing_getAccount.decimals` / `boing_getNetworkInfo.native_currency` say which.
 * Token amounts (reference token v2, pools) are separate: whole units with their own decimals metadata.
 * Pure helpers (no imports) so node:test can load this file directly.
 */

export const BOING_DECIMALS = 18;
/** Fee per gas in base units (0.000001 BOING); a 21,000-gas transfer costs 0.021 BOING. */
export const GAS_PRICE_BASE_UNITS = 1_000_000_000_000n;

/**
 * Ledger decimals (0 or 18) for amounts committed at `height`, from `native_currency`.
 * @param {{ decimals?: number; base_unit_decimals?: number; base_units_from_height?: number | null } | null | undefined} info
 * @param {number} height
 */
export function ledgerDecimalsAt(info, height) {
  if (!info) return 0;
  if (info.base_units_from_height === undefined) return Number(info.decimals ?? 0);
  if (info.base_units_from_height === null) return Number(info.base_unit_decimals ?? BOING_DECIMALS);
  return height >= info.base_units_from_height ? Number(info.base_unit_decimals ?? BOING_DECIMALS) : 0;
}

/**
 * Ledger amount → BOING string (grouped whole part; up to `maxFractionDigits`, trailing zeros trimmed).
 * @param {string | number | bigint | null | undefined} raw
 * @param {number} decimals ledger decimals (0 or 18)
 * @param {number} [maxFractionDigits]
 */
export function formatNativeLedger(raw, decimals, maxFractionDigits = 6) {
  if (raw == null) return '—';
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) return s;
  const v = BigInt(s);
  const d = Math.max(0, Number(decimals) || 0);
  const base = 10n ** BigInt(d);
  const whole = (v / base).toLocaleString('en-US');
  if (d === 0) return whole;
  const fracDigits = (v % base).toString().padStart(d, '0');
  const frac = fracDigits.slice(0, maxFractionDigits).replace(/0+$/, '');
  if (!frac && v > 0n && v < base) return `<0.${'0'.repeat(Math.max(0, maxFractionDigits - 1))}1`;
  return frac ? `${whole}.${frac}` : whole;
}

/**
 * BOING decimal string ("1.5") → ledger units string, or null when invalid / too many fractional digits.
 * @param {string} input
 * @param {number} decimals ledger decimals (0 or 18)
 */
export function parseBoingToLedger(input, decimals) {
  const t = String(input ?? '').trim().replace(/,/g, '');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return null;
  const [i = '', f = ''] = t.split('.');
  const d = Math.max(0, Number(decimals) || 0);
  if (f.replace(/0+$/, '').length > d) return null;
  const v = BigInt(i || '0') * 10n ** BigInt(d) + BigInt((f.padEnd(d, '0').slice(0, d)) || '0');
  return v.toString();
}

/**
 * Network fee in ledger units for `gasUsed`: gas x 10^12 base units (18 decimals), or ceil(gas / 21,000)
 * whole BOING before the switch.
 * @param {number | bigint} gasUsed
 * @param {number} decimals
 */
export function feeForGasLedger(gasUsed, decimals) {
  const g = BigInt(gasUsed);
  if (g <= 0n) return 0n;
  if (Number(decimals) >= BOING_DECIMALS) return g * GAS_PRICE_BASE_UNITS;
  return (g + 20_999n) / 21_000n;
}
