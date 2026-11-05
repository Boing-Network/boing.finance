/**
 * Create-and-seed factory AccountId (CREATE2 pool + bind + optional register in one call).
 * When set, Create Pool uses a single Express Batch instead of deploy + seed.
 * Deploy the factory from boing.network (`native_dex_create_and_seed_bytecode`) and publish here.
 */

function readEnv(name) {
  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env[name] === 'string') {
      return process.env[name].trim();
    }
  } catch {
    /* ignore */
  }
  return '';
}

/** Normalize 32-byte AccountId hex (optional 0x) → lowercase `0x`+64 or ''. */
export function normalizeCreateAndSeedFactoryHex(raw) {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const hex = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(hex) || /^0+$/.test(hex)) return '';
  return `0x${hex.toLowerCase()}`;
}

/** @returns {string} factory AccountId or '' when unset / invalid */
export function getCreateAndSeedFactoryHex() {
  return normalizeCreateAndSeedFactoryHex(readEnv('REACT_APP_BOING_NATIVE_CREATE_AND_SEED_FACTORY'));
}

/** True when Finance can offer one-approval create-and-seed. */
export function isCreateAndSeedFactoryConfigured() {
  return Boolean(getCreateAndSeedFactoryHex());
}
