// NewsAPI.org - crypto/DeFi news feed
// https://newsapi.org/docs/endpoints/everything
// Free tier: 100 requests/day for development

const NEWSAPI_BASE = 'https://newsapi.org/v2';
const API_KEY = process.env.REACT_APP_NEWSAPI_KEY;
const _CACHE_TTL_MS = 10 * 60 * 1000; // 10 min cache

/**
 * Fetch crypto/DeFi news from NewsAPI.org.
 * Only runs when REACT_APP_NEWSAPI_KEY is set.
 * @param {{ pageSize?: number, sortBy?: 'relevancy'|'popularity'|'publishedAt' }} [options]
 * @returns {Promise<{ articles: Array<{ title, url, source, publishedAt, description }>, totalResults: number } | null>}
 */
export async function getCryptoNews(options = {}) {
  if (!API_KEY) return null;

  const { pageSize = 8, sortBy = 'publishedAt' } = options;

  try {
    const params = new URLSearchParams({
      q: 'crypto OR bitcoin OR ethereum OR DeFi OR blockchain',
      language: 'en',
      sortBy,
      pageSize: String(pageSize),
      apiKey: API_KEY,
    });
    // Restrict to last 7 days to keep results fresh
    const from = new Date();
    from.setDate(from.getDate() - 7);
    params.set('from', from.toISOString().split('T')[0]);

    const url = `${NEWSAPI_BASE}/everything?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.status !== 'ok' || !Array.isArray(data.articles)) return null;

    return {
      articles: data.articles
        .filter((a) => a?.title && a?.url)
        .map((a) => ({
          title: a.title,
          url: a.url,
          source: a.source?.name || 'Unknown',
          publishedAt: a.publishedAt,
          description: a.description || null,
          urlToImage: a.urlToImage || null,
        })),
      totalResults: data.totalResults ?? 0,
    };
  } catch (err) {
    console.warn('NewsAPI error:', err?.message);
    return null;
  }
}

const newsService = { getCryptoNews };
export default newsService;
