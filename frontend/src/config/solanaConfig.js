/**
 * Solana network configuration
 */
export const SOLANA_NETWORKS = {
  mainnet: {
    name: 'Solana Mainnet',
    endpoint: process.env.REACT_APP_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
    explorer: 'https://explorer.solana.com',
    isTestnet: false,
  },
  devnet: {
    name: 'Solana Devnet',
    endpoint: process.env.REACT_APP_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com',
    explorer: 'https://explorer.solana.com/?cluster=devnet',
    isTestnet: true,
  },
};

export const DEFAULT_SOLANA_NETWORK = process.env.REACT_APP_SOLANA_NETWORK === 'mainnet' ? 'mainnet' : 'devnet';
export const MINT_ACCOUNT_RENT = 0.00144 * 1e9;
export const TOKEN_ACCOUNT_RENT = 0.00204 * 1e9;
export const SOLANA_TOKEN_DEPLOY_FEE_LAMPORTS = 0.01 * 1e9;
