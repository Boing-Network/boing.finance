// Portfolio Snapshot Service - uses Cloudflare D1 via backend API

const getApiUrl = () => process.env.REACT_APP_BACKEND_URL || 'http://localhost:8787';

/**
 * Save portfolio snapshot to D1 (backend)
 */
export async function saveSnapshot(userAddress, totalValueUsd, chainId = null) {
  const url = `${getApiUrl()}/api/portfolio/snapshot`;
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
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.warn('[PortfolioSnapshot] Save failed:', e.message);
    return false;
  }
}

/**
 * Get portfolio history from D1 (backend)
 */
export async function getSnapshots(userAddress, days = 30) {
  const url = `${getApiUrl()}/api/portfolio/snapshots?address=${encodeURIComponent(userAddress)}&days=${days}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (e) {
    console.warn('[PortfolioSnapshot] Fetch failed:', e.message);
    return [];
  }
}
