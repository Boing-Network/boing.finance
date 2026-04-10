import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Touch under frontend/ when a path-filtered deploy workflow must re-run without other changes.
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
  '@noble/hashes/utils': resolveFromFrontend('@noble/hashes/utils'),
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
  'REACT_APP_BOING_NATIVE_AMM_LP_VAULT',
  'REACT_APP_BOING_NATIVE_AMM_LP_SHARE_TOKEN',
  'REACT_APP_BOING_NATIVE_VM_DEX_FACTORY',
  'REACT_APP_BOING_NATIVE_VM_LIQUIDITY_LOCKER',
  'REACT_APP_BOING_NATIVE_VM_SWAP_ROUTER',
  'REACT_APP_BOING_NATIVE_DEX_LEDGER_ROUTER_V2',
  'REACT_APP_BOING_NATIVE_DEX_LEDGER_ROUTER_V3',
  'REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK',
  'REACT_APP_BOING_NATIVE_DEX_TOKEN_LIST_JSON',
  'REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL',
  'REACT_APP_BOING_NATIVE_DEX_TOKEN_USD_JSON',
  'REACT_APP_BOING_NATIVE_DEX_SWAP_LOG_SCAN_BLOCKS',
  'REACT_APP_BOING_NATIVE_DEX_ORACLE_MAP_JSON',
  'REACT_APP_BOING_NATIVE_DEX_VAULT_POOL_MAP_JSON',
  'REACT_APP_BOING_NATIVE_DEX_RESERVE_SAMPLE_MS',
  'REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD',
  'REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE',
  'REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL',
  'REACT_APP_BOING_NATIVE_DEX_DIRECTORY_MAX_POOLS',
  'REACT_APP_BOING_NATIVE_VM_DEX_UI',
  'REACT_APP_BOING_L1_DEX_DOCS_URL',
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

/** Matches public/scripts/generate-version-manifest.js (prebuild). Busts CDN/browser favicon + OG caches per deploy. */
function readPublicAssetVersion() {
  try {
    const p = path.join(__dirname, 'public', 'version.txt');
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return `dev-${Date.now()}`;
  }
}

export default defineConfig(({ mode }) => {
  const assetVersion = readPublicAssetVersion();

  return {
  plugins: [
    react({ include: '**/*.{jsx,js,tsx,ts}' }),
    {
      name: 'inject-asset-version-html',
      transformIndexHtml(html) {
        return html.replaceAll('%VITE_ASSET_VERSION%', encodeURIComponent(assetVersion));
      },
    },
  ],
  define: {
    ...envDefine(mode),
    'import.meta.env.VITE_ASSET_VERSION': JSON.stringify(assetVersion),
  },
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
};
});
