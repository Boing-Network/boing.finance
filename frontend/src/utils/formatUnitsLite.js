/** Same output as ethers v6 `formatUnits` (e.g. `1.0`, `0.25`; `5` for 0 decimals) without loading ethers. */
export function formatUnitsLite(value, decimals = 18) {
  let v = BigInt(value);
  const neg = v < 0n;
  if (neg) v = -v;
  const d = Number(decimals);
  const s = v.toString().padStart(d + 1, '0');
  const whole = d > 0 ? s.slice(0, s.length - d) : s;
  if (d === 0) return `${neg ? '-' : ''}${whole}`;
  let frac = s.slice(s.length - d).replace(/0+$/, '');
  if (!frac) frac = '0';
  return `${neg ? '-' : ''}${whole}.${frac}`;
}
