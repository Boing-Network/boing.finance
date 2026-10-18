/**
 * The Boing pool cards and Your liquidity moved from the Swap page's tabs to the Pools page (/pools, tabs
 * `?tab=all` (default) and `?tab=liquidity`). Old deep links keep working:
 * - `/swap?nativeTradeTab=pools`, `/swap?tab=pools` → `/pools`
 * - `/swap?nativePool=0x…` → `/pools?pool=0x…` (pre-fills the pool search)
 * - `/swap?nativeTradeTab=liquidity`, `/swap?tab=liquidity` → `/pools?tab=liquidity` (an `addPool=0x…` is kept)
 *
 * @param {string} search `location.search` of a /swap URL
 * @returns {string | null} target URL, or null to stay on Swap
 */
export function poolsRedirectFromSwapSearch(search) {
  const q = new URLSearchParams(search || '');
  const tab = (q.get('nativeTradeTab') || q.get('tab') || '').trim().toLowerCase();
  const pool = (q.get('nativePool') || '').trim();
  const poolOk = /^0x[0-9a-fA-F]{64}$/.test(pool);
  const addPool = (q.get('addPool') || '').trim();
  const addPoolOk = /^0x[0-9a-fA-F]{64}$/.test(addPool);
  const liquidity = tab === 'liquidity' || (addPoolOk && tab !== 'pools');
  if (tab !== 'pools' && !poolOk && !liquidity) return null;
  const out = new URLSearchParams();
  if (liquidity) {
    out.set('tab', 'liquidity');
    if (addPoolOk) out.set('addPool', `0x${addPool.slice(2).toLowerCase()}`);
  } else if (poolOk) {
    out.set('pool', `0x${pool.slice(2).toLowerCase()}`);
  }
  if (q.get('noIntro') === '1') out.set('noIntro', '1');
  const s = out.toString();
  return s ? `/pools?${s}` : '/pools';
}

/** Pools page tab from `?tab=`: 'liquidity' (Your liquidity) or 'all' (All pools, the default). */
export function parsePoolsTab(raw) {
  const t = String(raw || '').trim().toLowerCase();
  return t === 'liquidity' || t === 'my' || t === 'positions' ? 'liquidity' : 'all';
}

/** `/swap` deep link that opens the Swap card with this pair preselected (consumed by NativeBoingTradeHub). */
export function boingSwapPairHref(tokenInHex, tokenOutHex) {
  const q = new URLSearchParams({ nativeTokenIn: tokenInHex, nativeTokenOut: tokenOutHex });
  return `/swap?${q.toString()}`;
}

/** `/pools` deep link that opens Your liquidity with the add form for this pool. */
export function boingAddLiquidityHref(poolHex) {
  const q = new URLSearchParams({ tab: 'liquidity', addPool: poolHex });
  return `/pools?${q.toString()}`;
}
