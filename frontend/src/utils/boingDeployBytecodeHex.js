/**
 * Validate deploy bytecode for Advanced paste (even-length hex). SDK `ensure0xHex` only prefixes.
 * @param {string} raw
 * @returns {`0x${string}`|undefined}
 */
export function tryParseEvenLengthDeployBytecodeHex(raw) {
  if (!raw || typeof raw !== 'string') return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]+$/i.test(body) || body.length % 2 !== 0) return undefined;
  return `0x${body.toLowerCase()}`;
}
