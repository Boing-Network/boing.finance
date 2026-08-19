// Portfolio Snapshot Service - uses Cloudflare D1 via backend API
import { apiPath } from '../config';
import logger from '../utils/logger';

/**
 * Save portfolio snapshot to D1 (backend)
 */
export async function saveSnapshot(userAddress, totalValueUsd, chainId = null) {
  const url = apiPath('portfolio/snapshot');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress: String(userAddress).toLowerCase(),
        totalValueUsd: parseFloat(totalValueUsd) || 0,
        chainId: chainId ?? null
      })
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success === true;
  } catch (e) {
    logger.warn('[PortfolioSnapshot] Save failed:', e.message);
    return false;
  }
}

/**
 * Get portfolio history from D1 (backend)
 */
export async function getSnapshots(userAddress, days = 30) {
  const url = `${apiPath('portfolio/snapshots')}?address=${encodeURIComponent(userAddress)}&days=${days}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (e) {
    logger.warn('[PortfolioSnapshot] Fetch failed:', e.message);
    return [];
  }
}
