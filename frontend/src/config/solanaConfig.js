/**
 * Solana network configuration
 */
import { apiPath } from '../config';
import { getHeliusRpcUrl } from '../services/heliusService';

/** Public hosts that currently 403 many browser origins (Cloudflare Pages included). */
function isOfficialPublicSolanaRpc(url) {
  return /https?:\/\/api\.(devnet|testnet|mainnet-beta)\.solana\.com\/?$/i.test(String(url || '').trim());
}

function envRpc(network) {
  const raw = network === 'mainnet'
    ? process.env.REACT_APP_SOLANA_MAINNET_RPC
    : process.env.REACT_APP_SOLANA_DEVNET_RPC;
  const url = String(raw || '').trim();
  return url || '';
}

function workerRpc(cluster) {
  return `${apiPath('solana/rpc')}?cluster=${cluster}`;
}

/**
 * Ordered RPC URLs for the selected cluster.
 * Browser uses the Worker proxy first so Helius stays server-side.
 * Public Ankr/Llama/OnFinality hosts are not probed from the browser
 * (403, DNS failures, and 429 retries stall wallet setup).
 */
export function getSolanaRpcEndpoints(network = 'devnet') {
  const cluster = network === 'mainnet' ? 'mainnet' : 'devnet';
  const urls = [];
  const push = (url) => {
    const trimmed = String(url || '').trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  push(workerRpc(cluster));

  const configured = envRpc(cluster);
  if (configured && !isOfficialPublicSolanaRpc(configured)) {
    push(configured);
  }

  push(getHeliusRpcUrl(cluster));
  return urls;
}

export function getSolanaRpcUrl(network = 'devnet') {
  return getSolanaRpcEndpoints(network)[0];
}

/**
 * @solana/web3.js always sends `solana-client`. The Worker CORS allow-list
 * historically omitted it, and browsers cache that preflight for 24h.
 * Strip the header so POST /api/solana/rpc only needs Content-Type.
 */
export function solanaWeb3Fetch(input, init) {
  if (init?.headers) {
    const headers = new Headers(init.headers);
    headers.delete('solana-client');
    return fetch(input, { ...init, headers });
  }
  if (typeof Request !== 'undefined' && input instanceof Request) {
    const headers = new Headers(input.headers);
    headers.delete('solana-client');
    return fetch(new Request(input, { headers }));
  }
  return fetch(input, init);
}

export function solanaConnectionConfig(extra = {}) {
  return {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60_000,
    disableRetryOnRateLimit: true,
    fetch: solanaWeb3Fetch,
    ...extra,
  };
}

export function isSolanaRpcTransportError(error) {
  const message = error?.message || String(error || '');
  return /403|access forbidden|failed to fetch|ssl|err_ssl|network error|load failed|400/i.test(message);
}

export function formatSolanaRpcError(error, network = 'devnet') {
  if (!isSolanaRpcTransportError(error)) {
    return error?.message || 'Solana RPC request failed';
  }
  const cluster = network === 'mainnet' ? 'mainnet' : 'devnet';
  return `Could not reach a Solana ${cluster} RPC. Refresh and try again. If this continues, the Worker RPC proxy is unavailable.`;
}

export const SOLANA_NETWORKS = {
  mainnet: {
    name: 'Solana Mainnet',
    get endpoint() {
      return getSolanaRpcUrl('mainnet');
    },
    explorer: 'https://explorer.solana.com',
    isTestnet: false,
  },
  devnet: {
    name: 'Solana Devnet',
    get endpoint() {
      return getSolanaRpcUrl('devnet');
    },
    explorer: 'https://explorer.solana.com/?cluster=devnet',
    isTestnet: true,
  },
};

export const DEFAULT_SOLANA_NETWORK = process.env.REACT_APP_SOLANA_NETWORK === 'mainnet' ? 'mainnet' : 'devnet';
export const MINT_ACCOUNT_RENT = 0.00144 * 1e9;
export const TOKEN_ACCOUNT_RENT = 0.00204 * 1e9;
export const SOLANA_TOKEN_DEPLOY_FEE_LAMPORTS = 0.01 * 1e9;
