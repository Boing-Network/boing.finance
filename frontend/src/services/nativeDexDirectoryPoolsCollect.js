/**
 * Paginate Worker GET /v1/directory/pools (D1 directory). Duplicates boing-sdk
 * `collectAllNativeDexDirectoryPools` so production builds work when `boing-sdk`
 * dist does not yet export it (e.g. CI checkout of boing.network/boing-sdk).
 */

const NATIVE_DEX_DIRECTORY_API_ID = 'boing-native-dex-directory/v1';

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isHex32(v) {
  return typeof v === 'string' && /^0x[0-9a-f]{64}$/i.test(v.trim());
}

/**
 * @param {unknown} o
 * @returns {Record<string, unknown> | null}
 */
function tryParseIndexerPoolRow(o) {
  if (!isPlainObject(o)) return null;
  const poolHex = String(o.poolHex || '').trim().toLowerCase();
  const tokenAHex = String(o.tokenAHex || '').trim().toLowerCase();
  const tokenBHex = String(o.tokenBHex || '').trim().toLowerCase();
  if (!isHex32(poolHex) || !isHex32(tokenAHex) || !isHex32(tokenBHex)) return null;
  return { ...o, poolHex, tokenAHex, tokenBHex };
}

/**
 * @param {unknown} data
 * @returns {{
 *   limit: number,
 *   cursor: string | null,
 *   nextCursor: string | null,
 *   hasMore: boolean,
 *   pools: Record<string, unknown>[]
 * } | null}
 */
function parseNativeDexDirectoryPoolsPageResponse(data) {
  if (!isPlainObject(data)) return null;
  if (data.api !== NATIVE_DEX_DIRECTORY_API_ID) return null;
  const limit = data.limit;
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 1) return null;
  const cursor = data.cursor;
  if (cursor != null && typeof cursor !== 'string') return null;
  const nextCursor = data.nextCursor;
  if (nextCursor != null && typeof nextCursor !== 'string') return null;
  if (typeof data.hasMore !== 'boolean') return null;
  if (!Array.isArray(data.pools)) return null;
  const pools = [];
  for (const row of data.pools) {
    const p = tryParseIndexerPoolRow(row);
    if (p) pools.push(p);
  }
  return {
    limit,
    cursor: cursor ?? null,
    nextCursor: nextCursor ?? null,
    hasMore: data.hasMore,
    pools,
  };
}

/**
 * @param {string} baseUrl
 * @param {{ limit?: number | null, cursor?: string | null }} query
 * @param {RequestInit} [init]
 */
async function fetchNativeDexDirectoryPoolsPage(baseUrl, query = {}, init) {
  const root = String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '');
  const u = new URL(`${root}/v1/directory/pools`);
  if (query.limit != null) u.searchParams.set('limit', String(query.limit));
  if (query.cursor != null && query.cursor !== '') u.searchParams.set('cursor', query.cursor);
  const url = u.toString();
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: { Accept: 'application/json', ...init?.headers },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from directory worker (${res.status})`);
  }
  if (!res.ok) {
    const errMsg = isPlainObject(data) && typeof data.error === 'string' ? data.error : `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  const parsed = parseNativeDexDirectoryPoolsPageResponse(data);
  if (!parsed) {
    throw new Error('Unexpected /v1/directory/pools JSON shape');
  }
  return parsed;
}

/**
 * @param {string} baseUrl — Worker origin (no path)
 * @param {{
 *   pageLimit?: number,
 *   maxPools?: number,
 *   maxPages?: number,
 *   init?: RequestInit
 * }} [opts]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function collectAllNativeDexDirectoryPools(baseUrl, opts = {}) {
  const pageLimit = Math.min(100, Math.max(1, opts.pageLimit ?? 100));
  const maxPools = opts.maxPools ?? Number.POSITIVE_INFINITY;
  const maxPages = opts.maxPages ?? 10_000;
  /** @type {Record<string, unknown>[]} */
  const out = [];
  let cursor = /** @type {string | null | undefined} */ (undefined);

  for (let page = 0; page < maxPages; page++) {
    const pageRes = await fetchNativeDexDirectoryPoolsPage(
      baseUrl,
      { limit: pageLimit, cursor: cursor ?? null },
      opts.init
    );
    for (const p of pageRes.pools) {
      out.push(p);
      if (out.length >= maxPools) return out.slice(0, maxPools);
    }
    if (!pageRes.hasMore || pageRes.nextCursor == null || pageRes.nextCursor === '') break;
    cursor = pageRes.nextCursor;
  }
  return out;
}
