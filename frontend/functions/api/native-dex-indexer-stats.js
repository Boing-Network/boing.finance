/**
 * On-demand native DEX **stats** JSON (boing-sdk). GET /api/native-dex-indexer-stats
 *
 * Optional KV (Cloudflare Pages): bind `NATIVE_DEX_INDEXER_KV`; key `native_dex_indexer_state_v1`.
 *
 * Query (optional): `pools_page` + `pools_page_size` (1–500) to paginate `pools[]` only.
 *
 * **Directory (D1):** lives on the `boing-native-dex-indexer` Worker (`/v1/directory/*`), not here. The SPA merges
 * Worker directory rows when `REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL` is set (see `nativeDexIndexerDirectoryMerge.js`).
 *
 * Env: see `indexer/buildNativeDexIndexerStats.mjs` + `NATIVE_DEX_INDEXER_API_DISABLE`, `BOING_TESTNET_RPC_URL`.
 * Disk state (`NATIVE_DEX_INDEXER_STATE_PATH`) is CLI-only via `scripts/native-dex-indexer-cli.mjs`.
 */

import { buildNativeDexIndexerStats } from '../../indexer/buildNativeDexIndexerStats.mjs';
import { sliceIndexerPoolsInPayloadForUrl } from '../lib/sliceIndexerPoolsResponse.mjs';

export async function onRequestGet({ env, request }) {
  const disable = String(env.NATIVE_DEX_INDEXER_API_DISABLE || '').trim();
  if (disable === '1' || disable.toLowerCase() === 'true') {
    return new Response(JSON.stringify({ error: 'native-dex-indexer API disabled', pools: [], history: {} }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** @type {import('boing-sdk').NativeDexIndexerHistoryStore | null} */
  let historyStore = null;
  if (env.NATIVE_DEX_INDEXER_KV && typeof env.NATIVE_DEX_INDEXER_KV.get === 'function') {
    const kv = env.NATIVE_DEX_INDEXER_KV;
    historyStore = {
      get: () => kv.get('native_dex_indexer_state_v1'),
      put: (body) => kv.put('native_dex_indexer_state_v1', body),
    };
  }

  try {
    const payload = await buildNativeDexIndexerStats({
      env,
      historyStore,
    });
    const url = new URL(request.url);
    const body = sliceIndexerPoolsInPayloadForUrl(
      /** @type {Record<string, unknown>} */ (payload),
      url
    );
    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30, s-maxage=60',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
        updatedAt: new Date().toISOString(),
        pools: [],
        history: {},
        tokenDirectory: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
