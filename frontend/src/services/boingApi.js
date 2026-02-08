/**
 * BOING API service - points, activity. Uses backend /api/boing endpoints.
 */

import { getApiUrl } from '../config.js';

const base = () => `${getApiUrl().replace(/\/api$/, '')}/api/boing`;

export async function getPoints(address) {
  const res = await fetch(`${base()}/points/${address}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch points');
  return json.data;
}

export async function getPointsActivity(address, { limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  const res = await fetch(`${base()}/points/${address}/activity?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activity');
  return json.data;
}

export async function accruePoints({ address, points, action, txHash, chainId, metadata }) {
  const res = await fetch(`${base()}/points/accrue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, points, action, txHash, chainId, metadata }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to accrue points');
  return json.data;
}

export async function getAllActivity({ limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  const res = await fetch(`${base()}/activity?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch activity');
  return json.data;
}
