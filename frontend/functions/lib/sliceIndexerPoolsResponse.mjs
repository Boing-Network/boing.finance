/**
 * Optional query params for large indexer payloads:
 * - pools_page — 0-based page index
 * - pools_page_size — max pools per page (1–500)
 *
 * When both are valid integers, `pools` is sliced and `poolsPageMeta` is added.
 * `tokenDirectory` and `history` are unchanged.
 *
 * @param {Record<string, unknown>} payload
 * @param {URL} url
 * @returns {Record<string, unknown>}
 */
export function sliceIndexerPoolsInPayloadForUrl(payload, url) {
  if (!payload || typeof payload !== 'object') return payload;
  const pageRaw = url.searchParams.get('pools_page');
  const sizeRaw = url.searchParams.get('pools_page_size');
  if (pageRaw == null || sizeRaw == null || pageRaw === '' || sizeRaw === '') return payload;
  const page = parseInt(String(pageRaw), 10);
  const pageSize = parseInt(String(sizeRaw), 10);
  if (!Number.isFinite(page) || page < 0) return payload;
  if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 500) return payload;
  const pools = Array.isArray(payload.pools) ? /** @type {unknown[]} */ (payload.pools) : [];
  const total = pools.length;
  const start = page * pageSize;
  const slice = pools.slice(start, start + pageSize);
  return {
    ...payload,
    pools: slice,
    poolsPageMeta: {
      page,
      pageSize,
      total,
      returned: slice.length,
    },
  };
}
