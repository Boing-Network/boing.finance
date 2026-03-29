/**
 * Purpose categories accepted by protocol QA (boing_qa / mempool).
 * Align with crates/boing-qa VALID_PURPOSE_CATEGORIES (lowercase comparison).
 */
export const BOING_QA_PURPOSE_OPTIONS = [
  { value: 'dapp', label: 'dapp — general application' },
  { value: 'token', label: 'token' },
  { value: 'nft', label: 'nft' },
  { value: 'meme', label: 'meme' },
  { value: 'community', label: 'community' },
  { value: 'entertainment', label: 'entertainment' },
  { value: 'tooling', label: 'tooling' },
  { value: 'other', label: 'other (provide description hash if possible)' }
];

const PURPOSE_LC = new Set(BOING_QA_PURPOSE_OPTIONS.map((o) => o.value));

/**
 * @param {string} s
 * @returns {boolean}
 */
export function isValidBoingQaPurpose(s) {
  if (!s || typeof s !== 'string') return false;
  return PURPOSE_LC.has(s.trim().toLowerCase());
}

/** 32-byte zero placeholder when RPC expects description_hash before asset_* params. */
export const BOING_QA_EMPTY_DESCRIPTION_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
