import { boingJsonRpc, normalizeBoingFaucetAccountHex } from './boingTestnetRpc';
import { getSharedBoingClient } from './boingNativeDexClient';

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
 * @returns {Promise<{
 *   gas_used: number,
 *   success: boolean,
 *   return_data?: string,
 *   logs?: unknown[],
 *   error?: string,
 *   suggested_access_list?: { read: string[], write: string[] },
 *   access_list_covers_suggestion?: boolean
 * }>}
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

const BOING_SIMULATE_CONTRACT_CALL = 'boing_simulateContractCall';

/**
 * Unsigned contract-call simulation.
 * - When `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall`, uses **boing-sdk**
 *   `BoingClient.simulateContractCall` (RPC-API-SPEC / boing-node). Payload must look like Express
 *   `contract_call`: `{ contract, calldata, origin? }` (optional `access_list` ignored for simulate).
 * - Optionally checks `boing_rpcSupportedMethods` when `REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE=1`.
 * - Any other method name: legacy `boingJsonRpc(method, [payload])`.
 *
 * @param {Record<string, unknown>} payload — e.g. `{ contract, calldata, origin, access_list? }`
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: true, method: string, result: unknown } | { ok: false, method: string, unsupported: true, message: string }>}
 */
export async function tryBoingUnsignedContractSimulate(payload, options = {}) {
  const raw = (process.env.REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD ?? '').trim();
  if (!raw || raw === '0' || raw.toLowerCase() === 'off') {
    return {
      ok: false,
      method: '',
      unsupported: true,
      message:
        'Set REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall when your node supports it (see RPC-API-SPEC / boing-node), or another extension method name for legacy single-arg JSON-RPC.',
    };
  }

  const strictProbe = String(process.env.REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE || '').trim() === '1';

  if (raw === BOING_SIMULATE_CONTRACT_CALL) {
    const contract = typeof payload.contract === 'string' ? payload.contract.trim() : '';
    const calldata = typeof payload.calldata === 'string' ? payload.calldata.trim() : '';
    const origin = typeof payload.origin === 'string' ? payload.origin.trim() : '';
    if (!contract || !calldata) {
      return {
        ok: false,
        method: raw,
        unsupported: true,
        message: 'Payload must include string `contract` and `calldata` (32-byte hex contract + calldata hex).',
      };
    }
    try {
      const client = getSharedBoingClient();
      if (strictProbe) {
        try {
          const methods = await client.rpcSupportedMethods();
          if (Array.isArray(methods) && !methods.includes(BOING_SIMULATE_CONTRACT_CALL)) {
            return {
              ok: false,
              method: raw,
              unsupported: true,
              message:
                'boing_rpcSupportedMethods does not list boing_simulateContractCall. Remove REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE or upgrade the node.',
            };
          }
        } catch {
          /* if supported-methods is missing, still try simulate */
        }
      }
      const senderHex = origin ? normalizeBoingFaucetAccountHex(origin) : null;
      if (origin && !senderHex) {
        return {
          ok: false,
          method: raw,
          unsupported: true,
          message: 'origin must be a 32-byte Boing account id (64 hex chars) for boing_simulateContractCall.',
        };
      }
      const result = await client.simulateContractCall(
        contract,
        calldata,
        senderHex ? { senderHex } : undefined
      );
      return { ok: true, method: raw, result };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/not found|unsupported|unknown method|invalid method|32601/i.test(msg)) {
        return { ok: false, method: raw, unsupported: true, message: msg };
      }
      throw e;
    }
  }

  try {
    const result = await boingJsonRpc(raw, [payload], options);
    return { ok: true, method: raw, result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not found|unsupported|unknown method|invalid method|32601/i.test(msg)) {
      return { ok: false, method: raw, unsupported: true, message: msg };
    }
    throw e;
  }
}
