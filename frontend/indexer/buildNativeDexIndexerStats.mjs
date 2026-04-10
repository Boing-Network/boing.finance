/**
 * Env-aware wrapper around {@link buildNativeDexIndexerStatsForClient} from boing-sdk.
 * CLI, Cloudflare Pages, and optional KV-backed Workers use this module.
 */

import {
  buildDexOverridesFromPlainEnv,
  buildNativeDexIndexerStatsForClient,
  buildNativeDexIntegrationOverridesFromProcessEnv,
  createClient,
} from 'boing-sdk';

export { buildDexOverridesFromPlainEnv };

function parseIntEnv(n, fallback) {
  const v = parseInt(String(n ?? ''), 10);
  return Number.isFinite(v) ? v : fallback;
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
 * @param {string} path
 * @returns {import('boing-sdk').NativeDexIndexerHistoryStore}
 */
function createFsHistoryStore(path) {
  return {
    async get() {
      const fs = await import('node:fs');
      if (!fs.existsSync(path)) return null;
      return fs.readFileSync(path, 'utf8');
    },
    async put(body) {
      const fs = await import('node:fs');
      fs.writeFileSync(path, body, 'utf8');
    },
  };
}

/**
 * @typedef {{
 *   rpcBaseUrl?: string,
 *   registerFromBlock?: number | null,
 *   logScanBlocks?: number,
 *   persistStatePath?: string | null,
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

  const stateFromEnv = envGet('NATIVE_DEX_INDEXER_STATE_PATH', envObj);
  const persistStatePath =
    options.persistStatePath !== undefined
      ? options.persistStatePath
      : stateFromEnv !== ''
        ? stateFromEnv
        : null;

  const mergedOverrides = {
    ...buildNativeDexIntegrationOverridesFromProcessEnv(),
    ...buildDexOverridesFromPlainEnv(envObj || {}),
    ...(options.overrides || {}),
  };
  const ov = Object.keys(mergedOverrides).length ? mergedOverrides : undefined;

  /** @type {import('boing-sdk').NativeDexIndexerHistoryStore | null} */
  let historyStore = options.historyStore ?? null;
  if (!historyStore && persistStatePath) {
    historyStore = createFsHistoryStore(persistStatePath);
  }

  const client = createClient({ baseUrl: rpcBaseUrl });

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
