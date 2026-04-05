import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Resolve a dependency as installed under frontend/node_modules.
 * boing-sdk sources live under ../boing.network/boing-sdk/dist; Node's default
 * walk hits repo root before frontend/, so Rollup cannot find @noble/* without this.
 */
function resolveFromFrontend(spec) {
  return require.resolve(spec, { paths: [__dirname] });
}

const nobleAliases = {
  '@noble/hashes/blake3': resolveFromFrontend('@noble/hashes/blake3'),
  '@noble/ed25519': resolveFromFrontend('@noble/ed25519'),
};

/** Every REACT_APP_* referenced in src gets a static define so `process` is never needed at runtime. */
const REACT_APP_DEFAULTS = [
  'REACT_APP_ENV',
  'REACT_APP_ENVIRONMENT',
  'REACT_APP_API_URL',
  'REACT_APP_VERSION',
  'REACT_APP_BACKEND_URL',
  'REACT_APP_COINGECKO_API_KEY',
  'REACT_APP_NEWSAPI_KEY',
  'REACT_APP_ETHERSCAN_API_KEY',
  'REACT_APP_SOLANA_NETWORK',
  'REACT_APP_SOLANA_MAINNET_RPC',
  'REACT_APP_SOLANA_DEVNET_RPC',
  'REACT_APP_PINATA_API_KEY',
  'REACT_APP_THE_GRAPH_API_KEY',
  'REACT_APP_THE_GRAPH_API_TOKEN',
  'REACT_APP_LIFI_API_KEY',
  'REACT_APP_ALCHEMY_API_KEY',
  'REACT_APP_ETHEREUM_RPC_URL',
  'REACT_APP_POLYGON_RPC_URL',
  'REACT_APP_BSC_RPC_URL',
  'REACT_APP_ARBITRUM_RPC_URL',
  'REACT_APP_OPTIMISM_RPC_URL',
  'REACT_APP_BASE_RPC_URL',
  'REACT_APP_SEPOLIA_RPC_URL',
  'REACT_APP_MUMBAI_RPC_URL',
  'REACT_APP_BSC_TESTNET_RPC_URL',
  'REACT_APP_FANTOM_RPC_URL',
  'REACT_APP_AVALANCHE_RPC_URL',
  'REACT_APP_LINEA_RPC_URL',
  'REACT_APP_POLYGON_ZKEVM_RPC_URL',
  'REACT_APP_ZKSYNC_RPC_URL',
  'REACT_APP_SCROLL_RPC_URL',
  'REACT_APP_MANTLE_RPC_URL',
  'REACT_APP_BLAST_RPC_URL',
  'REACT_APP_OPBNB_RPC_URL',
  'REACT_APP_MODE_RPC_URL',
  'REACT_APP_BOING_TESTNET_RPC_DIRECT',
  'REACT_APP_BOING_NATIVE_AMM_POOL',
  'REACT_APP_BOING_REFERENCE_FUNGIBLE_TEMPLATE_BYTECODE_HEX',
  'REACT_APP_BOING_REFERENCE_TOKEN_BYTECODE',
  'REACT_APP_INFURA_PROJECT_ID',
  'REACT_APP_INFURA_PROJECT_SECRET',
  'REACT_APP_WEB3_STORAGE_API_KEY',
  'REACT_APP_STORACHA_API_KEY',
  'REACT_APP_NFT_STORAGE_API_KEY',
];

function envDefine(mode) {
  const fromFiles = {
    ...loadEnv(mode, process.cwd(), 'REACT_APP_'),
    ...loadEnv(mode, process.cwd(), 'VITE_'),
  };
  const merged = Object.fromEntries(REACT_APP_DEFAULTS.map((k) => [k, '']));
  Object.assign(merged, fromFiles);
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('REACT_APP_') || k.startsWith('VITE_')) {
      merged[k] = v ?? '';
    }
  }
  if (merged.REACT_APP_ENV && !merged.REACT_APP_ENVIRONMENT) {
    merged.REACT_APP_ENVIRONMENT = merged.REACT_APP_ENV;
  }
  if (merged.REACT_APP_ENVIRONMENT && !merged.REACT_APP_ENV) {
    merged.REACT_APP_ENV = merged.REACT_APP_ENVIRONMENT;
  }
  const define = {};
  for (const [key, value] of Object.entries(merged)) {
    define[`process.env.${key}`] = JSON.stringify(value == null ? '' : String(value));
  }
  define['process.env.NODE_ENV'] = JSON.stringify(
    mode === 'production' ? 'production' : 'development'
  );
  define['process.env.PUBLIC_URL'] = JSON.stringify('');
  return define;
}

export default defineConfig(({ mode }) => ({
  plugins: [react({ include: '**/*.{jsx,js,tsx,ts}' })],
  define: envDefine(mode),
  resolve: {
    alias: {
      ...nobleAliases,
      '@solana/codecs': path.resolve(
        __dirname,
        'node_modules/@solana/codecs/dist/index.browser.mjs'
      ),
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api/boing-rpc': {
        target: 'https://testnet-rpc.boing.network',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/',
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
  publicDir: 'public',
}));
