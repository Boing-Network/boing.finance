import { apiPath } from '../config';

/**
 * Fetch a backend JSON endpoint and throw on HTTP or `{ success: false }` payloads.
 */
export async function apiFetch(path, options) {
  const res = await fetch(apiPath(path), options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed (${res.status})`);
  }
  return json;
}
