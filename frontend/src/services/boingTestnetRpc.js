import { getNetworkByChainId } from '../config/networks';

const BOING_TESTNET_CHAIN_ID = 6913;

function normalizeRpcBaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/$/, '');
}

/**
 * Public Boing testnet JSON-RPC URL from env / networks config.
 * @returns {string}
 */
export function getBoingTestnetRpcUrl() {
  const net = getNetworkByChainId(BOING_TESTNET_CHAIN_ID);
  const fromConfig = net?.rpcUrls?.[0] || net?.rpcUrl;
  return normalizeRpcBaseUrl(fromConfig) || 'https://testnet-rpc.boing.network';
}

function boingRpcPostUrl() {
  if (typeof window === 'undefined') {
    return `${getBoingTestnetRpcUrl()}/`;
  }
  if (process.env.REACT_APP_BOING_TESTNET_RPC_DIRECT === '1') {
    return `${getBoingTestnetRpcUrl()}/`;
  }
  return `${window.location.origin}/api/boing-rpc`;
}

/**
 * Low-level Boing JSON-RPC POST. See boing.network RPC-API-SPEC.md.
 * In the browser, posts to same-origin `/api/boing-rpc` (Vite proxy in dev, Pages Function in prod)
 * so CORS on the public node is not required.
 * @param {string} method
 * @param {unknown[]} [params]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<unknown>}
 */
export async function boingJsonRpc(method, params = [], options = {}) {
  const url = boingRpcPostUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: options.signal
  });
  if (!res.ok) {
    throw new Error(`Boing RPC HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.error) {
    const msg = json.error.message || JSON.stringify(json.error);
    throw new Error(msg);
  }
  return json.result;
}

/**
 * @returns {Promise<number>}
 */
export async function fetchBoingTestnetChainHeight(options = {}) {
  const h = await boingJsonRpc('boing_chainHeight', [], options);
  if (typeof h !== 'number' || Number.isNaN(h)) {
    throw new Error('Invalid boing_chainHeight response');
  }
  return h;
}

/**
 * Normalize account id for boing_faucetRequest (32-byte hex, 0x + 64 hex chars).
 * @param {string} account
 * @returns {string | null}
 */
export function normalizeBoingFaucetAccountHex(account) {
  if (!account || typeof account !== 'string') return null;
  const trimmed = account.trim();
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
  if (hex.length !== 64) return null;
  return `0x${hex.toLowerCase()}`;
}

/**
 * Request testnet BOING from the public faucet RPC (rate-limited server-side).
 * @param {string} accountHex — 0x + 64 hex (Boing account id)
 * @param {object} [options]
 * @returns {Promise<unknown>}
 */
export async function requestBoingTestnetFaucet(accountHex, options = {}) {
  const normalized = normalizeBoingFaucetAccountHex(accountHex);
  if (!normalized) {
    throw new Error('Boing faucet requires a 32-byte account id (64 hex characters).');
  }
  return boingJsonRpc('boing_faucetRequest', [normalized], options);
}
