/**
 * Shared API client: retries with exponential backoff and in-memory TTL cache.
 * Use for DefiLlama, GeckoTerminal, and other external DEX/market data to improve reliability.
 */

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 15000;

const cache = new Map();
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch with retries and optional exponential backoff.
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {{ retries?: number, retryDelay?: number, backoff?: boolean, timeout?: number }} [config]
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY_MS,
    backoff = true,
    timeout = DEFAULT_TIMEOUT_MS,
  } = config;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
        headers: { Accept: 'application/json', ...options.headers },
      });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      // Don't retry 429 (rate limit) - retrying makes it worse
      if (res.status === 429) return res;
      if (res.status >= 400 && res.status < 500) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      const delay = backoff ? retryDelay * Math.pow(2, attempt) : retryDelay;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/**
 * In-memory cache key for a request (URL + optional body/params).
 */
function cacheKey(url, keyExtra = '') {
  return `${url}${keyExtra ? `::${keyExtra}` : ''}`;
}

/**
 * Cached fetch: run fetchWithRetry and store result in memory for ttlMs.
 * Returns parsed JSON when response is OK; otherwise null or throws.
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {{ ttlMs?: number, keyExtra?: string, retries?: number }} [config]
 * @returns {Promise<object|array|null>} Parsed JSON or null
 */
export async function cachedFetch(url, options = {}, config = {}) {
  const {
    ttlMs = DEFAULT_CACHE_TTL_MS,
    keyExtra = '',
    retries = DEFAULT_RETRIES,
  } = config;

  const key = cacheKey(url, keyExtra);
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }

  try {
    const res = await fetchWithRetry(url, options, { retries, timeout: DEFAULT_TIMEOUT_MS });
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  } catch (err) {
    console.warn('cachedFetch error:', err?.message);
    return null;
  }
}

/**
 * Clear cache (e.g. for testing or manual refresh).
 */
export function clearApiCache() {
  cache.clear();
}

const apiClient = { fetchWithRetry, cachedFetch, clearApiCache };
export default apiClient;
