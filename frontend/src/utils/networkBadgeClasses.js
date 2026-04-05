/**
 * Network / chain pill backgrounds — restricted to nebula + logo tokens
 * (cyan, finance-purple, teal, finance-green, finance-gold) so chain chips
 * stay on-brand while remaining distinguishable.
 */
export const NETWORK_BADGE_FALLBACK = 'bg-gray-600';

const PALETTE = [
  'bg-cyan-500',
  'bg-finance-purple',
  'bg-teal-600',
  'bg-finance-green',
  'bg-cyan-700',
  'bg-finance-gold',
];

/**
 * @param {string | number | null | undefined} chainId
 * @returns {string} Tailwind `bg-*` class
 */
export function getNetworkBadgeBgClass(chainId) {
  if (chainId === 'all' || chainId === '' || chainId === undefined || chainId === null) {
    return NETWORK_BADGE_FALLBACK;
  }
  const key = String(chainId);
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}
