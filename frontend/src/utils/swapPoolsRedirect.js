/**
 * The Boing pool cards moved from the Swap page's old "Pools" tab to the Pools page (/pools).
 * Old deep links keep working: `/swap?nativeTradeTab=pools`, `/swap?tab=pools` and `/swap?nativePool=0x…`
 * redirect to `/pools` (a pool id becomes `?pool=0x…`, which pre-fills the Pools search).
 *
 * @param {string} search `location.search` of a /swap URL
 * @returns {string | null} target URL, or null to stay on Swap
 */
export function poolsRedirectFromSwapSearch(search) {
  const q = new URLSearchParams(search || '');
  const tab = (q.get('nativeTradeTab') || q.get('tab') || '').trim().toLowerCase();
  const pool = (q.get('nativePool') || '').trim();
  const poolOk = /^0x[0-9a-fA-F]{64}$/.test(pool);
  if (tab !== 'pools' && !poolOk) return null;
  const out = new URLSearchParams();
  if (q.get('noIntro') === '1') out.set('noIntro', '1');
  if (poolOk) out.set('pool', `0x${pool.slice(2).toLowerCase()}`);
  const s = out.toString();
  return s ? `/pools?${s}` : '/pools';
}

/** `/swap` deep link that opens the Swap card with this pair preselected (consumed by NativeBoingTradeHub). */
export function boingSwapPairHref(tokenInHex, tokenOutHex) {
  const q = new URLSearchParams({ nativeTokenIn: tokenInHex, nativeTokenOut: tokenOutHex });
  return `/swap?${q.toString()}`;
}

/** `/swap` deep link that opens Your liquidity with the add panel for this pool. */
export function boingAddLiquidityHref(poolHex) {
  const q = new URLSearchParams({ nativeTradeTab: 'liquidity', addPool: poolHex });
  return `/swap?${q.toString()}`;
}
