/**
 * BOING API service - points, activity. Uses backend /api/boing endpoints.
 */

import { apiFetch } from '../utils/apiFetch.js';

export async function getPoints(address) {
  const json = await apiFetch(`boing/points/${address}`);
  return json.data;
}

export async function getPointsActivity(address, { limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  const json = await apiFetch(`boing/points/${address}/activity?${params}`);
  return json.data;
}

export async function accruePoints({ address, points, action, txHash, chainId, metadata }) {
  const json = await apiFetch('boing/points/accrue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, points, action, txHash, chainId, metadata }),
  });
  return json.data;
}

export async function getAllActivity({ limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  const json = await apiFetch(`boing/activity?${params}`);
  return json.data;
}
