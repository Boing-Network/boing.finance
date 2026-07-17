/**
 * Run async work over items with a concurrency cap.
 * Preserves input order in the returned array (failed items are null unless mapFn throws into Settled).
 */
export async function mapWithConcurrency(items, limit, mapFn) {
  const n = items.length;
  if (n === 0) return [];
  const concurrency = Math.max(1, Math.min(limit || 1, n));
  const results = new Array(n);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < n) {
      const i = nextIndex++;
      try {
        results[i] = await mapFn(items[i], i);
      } catch {
        results[i] = null;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}
