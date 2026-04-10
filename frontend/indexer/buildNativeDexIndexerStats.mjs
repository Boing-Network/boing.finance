/**
 * Env-aware wrapper around {@link buildNativeDexIndexerStatsForClient} (boing-sdk).
 * CLI, Cloudflare Pages, and optional KV-backed Workers use this module.
 *
 * Imports use `../node_modules/boing-sdk/dist/*.js` (not the package barrel) so Wrangler’s
 * esbuild bundles the indexer implementation even when upstream `dist/index.js` is stale
 * or omits re-exports on Boing-Network/boing.network main.
 *
 * Disk persistence: pass `historyStore` from `historyStoreFs.mjs` (CLI only). Do not use
 * `node:fs` here so Wrangler can bundle this file for Pages Functions without nodejs_compat.
 */

import { BoingClient } from '../node_modules/boing-sdk/dist/client.js';
import { buildNativeDexIntegrationOverridesFromProcessEnv } from '../node_modules/boing-sdk/dist/dexIntegration.js';
import {
  buildDexOverridesFromPlainEnv,
  buildNativeDexIndexerStatsForClient,
} from '../node_modules/boing-sdk/dist/nativeDexIndexerStats.js';

export { buildDexOverridesFromPlainEnv };

function parseIntEnv(n, fallback) {
  const v = parseInt(String(n ?? ''), 10);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * Public RPC edges often return 403 + "Just a moment…" to default Node `fetch` (GitHub Actions).
 * Optional: set `NATIVE_DEX_INDEXER_RPC_USER_AGENT` to override; set `NATIVE_DEX_INDEXER_RPC_NO_BROWSER_UA=1`
 * in CI to skip (e.g. internal RPC that rejects unknown UAs).
 */
function rpcClientConfig(baseUrl) {
  const raw =
    typeof process !== 'undefined' && String(process.env?.NATIVE_DEX_INDEXER_RPC_NO_BROWSER_UA || '').trim() === '1';
  const customUa =
    typeof process !== 'undefined' ? String(process.env?.NATIVE_DEX_INDEXER_RPC_USER_AGENT || '').trim() : '';
  const ci = typeof process !== 'undefined' && String(process.env?.GITHUB_ACTIONS || '').trim() === 'true';
  const ua =
    customUa ||
    (!raw && ci
      ? 'Mozilla/5.0 (compatible; BoingFinance-NativeDexIndexer/1.0; +https://github.com/Boing-Network/boing.finance)'
      : '');
  if (!ua) {
    return { baseUrl };
  }
  return {
    baseUrl,
    extraHeaders: {
      'User-Agent': ua,
      Accept: 'application/json',
    },
  };
}

/** @param {string} key @param {Record<string, string | undefined> | null | undefined} envObj */
function envGet(key, envObj) {
  if (envObj && typeof envObj === 'object' && envObj[key] != null && String(envObj[key]).trim()) {
    return String(envObj[key]).trim();
  }
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) return String(process.env[key]).trim();
  } catch {
    /* non-Node */
  }
  return '';
}

/**
 * @typedef {{
 *   rpcBaseUrl?: string,
 *   registerFromBlock?: number | null,
 *   logScanBlocks?: number,
 *   historyStore?: import('boing-sdk').NativeDexIndexerHistoryStore | null,
 *   overrides?: import('boing-sdk').NativeDexIntegrationOverrides,
 *   env?: Record<string, string | undefined>,
 * }} BuildNativeDexIndexerStatsOptions
 */

/**
 * @param {BuildNativeDexIndexerStatsOptions} [options]
 * @returns {Promise<import('boing-sdk').NativeDexIndexerStatsPayload>}
 */
export async function buildNativeDexIndexerStats(options = {}) {
  const envObj = options.env;
  const rpcBaseUrl = (
    options.rpcBaseUrl ||
    envGet('NATIVE_DEX_INDEXER_RPC_URL', envObj) ||
    envGet('BOING_TESTNET_RPC_URL', envObj) ||
    'https://testnet-rpc.boing.network'
  ).replace(/\/$/, '');

  const regStr = envGet('NATIVE_DEX_INDEXER_REGISTER_FROM_BLOCK', envObj);
  const registerFromBlock =
    options.registerFromBlock !== undefined
      ? options.registerFromBlock
      : regStr !== ''
        ? parseIntEnv(regStr, NaN)
        : NaN;

  const logScanBlocks = Math.min(
    Math.max(
      1,
      options.logScanBlocks ?? parseIntEnv(envGet('NATIVE_DEX_INDEXER_LOG_SCAN_BLOCKS', envObj), 8000)
    ),
    50_000
  );

  const mergedOverrides = {
    ...buildNativeDexIntegrationOverridesFromProcessEnv(),
    ...buildDexOverridesFromPlainEnv(envObj || {}),
    ...(options.overrides || {}),
  };
  const ov = Object.keys(mergedOverrides).length ? mergedOverrides : undefined;

  const historyStore = options.historyStore ?? null;

  const client = new BoingClient(rpcClientConfig(rpcBaseUrl));

  return buildNativeDexIndexerStatsForClient(client, {
    overrides: ov,
    registerFromBlock:
      Number.isFinite(registerFromBlock) && registerFromBlock >= 0 ? registerFromBlock : undefined,
    logScanBlocks,
    historyStore,
    tokenUsdJson: envGet('NATIVE_DEX_INDEXER_TOKEN_USD_JSON', envObj),
    tokenDirectoryExtraJson: envGet('NATIVE_DEX_INDEXER_TOKEN_DIRECTORY_JSON', envObj),
  });
}
