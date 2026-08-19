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
 * Browser → Worker proxy first (avoids public-RPC 403 / SSL failures), then
 * dedicated env/Helius, then CORS-friendly public providers.
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

  if (cluster === 'mainnet') {
    push('https://rpc.ankr.com/solana');
    push('https://solana.llamarpc.com');
    push('https://solana.api.onfinality.io/public');
  } else {
    push('https://rpc.ankr.com/solana_devnet');
  }

  return urls;
}

export function getSolanaRpcUrl(network = 'devnet') {
  return getSolanaRpcEndpoints(network)[0];
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
  return `Could not reach a Solana ${cluster} RPC from this browser. Public Solana endpoints block many sites (403) and some fallbacks fail TLS. Try again after a refresh, or set REACT_APP_HELIUS_API_KEY / REACT_APP_SOLANA_${cluster === 'mainnet' ? 'MAINNET' : 'DEVNET'}_RPC.`;
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
