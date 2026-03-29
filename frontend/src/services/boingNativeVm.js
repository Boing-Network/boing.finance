import { boingJsonRpc, normalizeBoingFaucetAccountHex } from './boingTestnetRpc';

/**
 * Normalize arbitrary hex for Boing RPC (0x + lowercase, even length).
 * @param {string} input
 * @returns {string}
 */
export function normalizeBoingRpcHex(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Expected a hex string');
  }
  const t = input.trim();
  const body = /^0x/i.test(t) ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]+$/.test(body) || body.length % 2 !== 0) {
    throw new Error('Invalid hex: use even-length hex digits (optional 0x prefix)');
  }
  return `0x${body.toLowerCase()}`;
}

/**
 * @param {string} account — wallet address / Boing account id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ balance: string; nonce: number; stake: string }>}
 */
export async function fetchBoingNativeAccount(account, options = {}) {
  const hex = normalizeBoingFaucetAccountHex(account);
  if (!hex) {
    throw new Error('Boing account id must be 32 bytes (64 hex characters).');
  }
  return boingJsonRpc('boing_getAccount', [hex], options);
}

/**
 * Pre-flight bytecode check (when node exposes boing_qaCheck).
 * @param {string} bytecodeHex
 * @param {string} [purposeCategory]
 * @param {string} [descriptionHash]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ result: string; rule_id?: string; message?: string; doc_url?: string }>}
 */
export async function qaCheckBoingBytecode(bytecodeHex, purposeCategory, descriptionHash, options = {}) {
  return qaCheckBoingDeploy(bytecodeHex, { purposeCategory, descriptionHash }, options);
}

/**
 * Full protocol QA preflight (matches node boing_qaCheck param order).
 * @param {string} bytecodeHex
 * @param {{
 *   purposeCategory?: string,
 *   descriptionHash?: string,
 *   assetName?: string,
 *   assetSymbol?: string,
 *   emptyDescriptionHash?: string
 * }} [fields]
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function qaCheckBoingDeploy(bytecodeHex, fields = {}, options = {}) {
  const hex = normalizeBoingRpcHex(bytecodeHex);
  const params = [hex];
  const purpose = fields.purposeCategory ?? fields.purpose_category;
  const descIn = fields.descriptionHash ?? fields.description_hash;
  const assetName = fields.assetName ?? fields.asset_name;
  const assetSymbol = fields.assetSymbol ?? fields.asset_symbol;
  const emptyDesc =
    fields.emptyDescriptionHash ||
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  if (purpose != null && purpose !== '') {
    params.push(String(purpose));
    const wantMeta =
      (assetName != null && String(assetName).trim() !== '') ||
      (assetSymbol != null && String(assetSymbol).trim() !== '');
    let desc = descIn;
    if (wantMeta && (desc == null || String(desc).trim() === '')) {
      desc = emptyDesc;
    }
    if (desc != null && String(desc).trim() !== '') {
      try {
        params.push(normalizeBoingRpcHex(String(desc)));
      } catch {
        params.push(String(desc).trim());
      }
      if (wantMeta && assetName != null && String(assetName).trim() !== '') {
        params.push(String(assetName).trim());
        if (assetSymbol != null && String(assetSymbol).trim() !== '') {
          params.push(String(assetSymbol).trim());
        }
      }
    }
  }
  return boingJsonRpc('boing_qaCheck', params, options);
}

/**
 * @param {string} hexSignedTx — hex-encoded signed Boing transaction (bincode)
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ gas_used: number; success: boolean; error?: string }>}
 */
export async function simulateBoingSignedTransaction(hexSignedTx, options = {}) {
  const hex = normalizeBoingRpcHex(hexSignedTx);
  return boingJsonRpc('boing_simulateTransaction', [hex], options);
}

/**
 * @param {string} hexSignedTx
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ tx_hash: string }>}
 */
export async function submitBoingSignedTransaction(hexSignedTx, options = {}) {
  const hex = normalizeBoingRpcHex(hexSignedTx);
  return boingJsonRpc('boing_submitTransaction', [hex], options);
}
