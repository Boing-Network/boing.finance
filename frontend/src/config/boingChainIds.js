/**
 * EIP-155–style chain IDs for Boing L1 (wallet / dApp convention).
 * Align with boing.network docs/THREE-CODEBASE-ALIGNMENT.md §3.
 * Block headers on Boing L1 do not carry chain ID; nodes do not expose boing_chainId RPC today.
 */

export const BOING_TESTNET_CHAIN_DECIMAL = 6913;
export const BOING_TESTNET_CHAIN_HEX = '0x1b01';

export const BOING_MAINNET_CHAIN_DECIMAL = 6914;
export const BOING_MAINNET_CHAIN_HEX = '0x1b02';

/**
 * @param {number} chainId — decimal chain id (e.g. from wallet)
 * @returns {string} e.g. "6913 · 0x1b01"
 */
export function formatEip155ChainId(chainId) {
  const n = Number(chainId);
  if (!Number.isFinite(n) || n < 0) return '';
  const hex = `0x${n.toString(16)}`;
  return `${n} · ${hex}`;
}
