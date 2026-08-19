/**
 * Solana network configuration
 */
import { getHeliusRpcUrl } from '../services/heliusService';

const OFFICIAL_PUBLIC_RPC = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
};

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

/**
 * Ordered RPC URLs for the selected cluster.
 * Prefer a dedicated provider (env or Helius). Official public RPCs are last
 * because they return HTTP 403 "Access forbidden" from many browser origins.
 */
export function getSolanaRpcEndpoints(network = 'devnet') {
  const cluster = network === 'mainnet' ? 'mainnet' : 'devnet';
  const urls = [];
  const push = (url) => {
    const trimmed = String(url || '').trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  const configured = envRpc(cluster);
  if (configured && !isOfficialPublicSolanaRpc(configured)) {
    push(configured);
  }

  push(getHeliusRpcUrl(cluster));

  if (cluster === 'mainnet') {
    push('https://solana-rpc.publicnode.com');
    push('https://solana.drpc.org');
  } else {
    push('https://solana-devnet.drpc.org');
    push('https://rpc.ankr.com/solana_devnet');
  }

  if (configured) push(configured);
  push(OFFICIAL_PUBLIC_RPC[cluster]);
  return urls;
}

export function getSolanaRpcUrl(network = 'devnet') {
  return getSolanaRpcEndpoints(network)[0];
}

export function isSolanaRpcForbiddenError(error) {
  const message = error?.message || String(error || '');
  return /403|access forbidden/i.test(message);
}

export function formatSolanaRpcError(error, network = 'devnet') {
  if (!isSolanaRpcForbiddenError(error)) {
    return error?.message || 'Solana RPC request failed';
  }
  const cluster = network === 'mainnet' ? 'mainnet' : 'devnet';
  const envName = cluster === 'mainnet' ? 'REACT_APP_SOLANA_MAINNET_RPC' : 'REACT_APP_SOLANA_DEVNET_RPC';
  return `Solana ${cluster} RPC blocked this request (403). The public api.${cluster === 'mainnet' ? 'mainnet-beta' : 'devnet'}.solana.com endpoint rejects many browser deploys. Set ${envName} or REACT_APP_HELIUS_API_KEY to a dedicated RPC.`;
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
