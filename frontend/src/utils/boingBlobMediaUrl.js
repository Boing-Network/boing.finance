/**
 * Resolve `boing://blob/0x…` to a browser-displayable object URL via `boing_getBlob`.
 */

import { blobIdHexFromBoingUri, hexToBytes } from '@boing-network/boing-sdk';
import { getSharedBoingClient } from '../services/boingNativeDexClient';

const cache = new Map();

function dataHexToBytes(dataHex) {
  if (dataHex instanceof Uint8Array) return dataHex;
  if (typeof dataHex !== 'string') return null;
  try {
    return hexToBytes(dataHex.startsWith('0x') ? dataHex : `0x${dataHex}`);
  } catch {
    return null;
  }
}

/**
 * @param {string} uri
 * @param {{ client?: import('@boing-network/boing-sdk').BoingClient, contentType?: string }} [opts]
 * @returns {Promise<string | null>} blob: URL or null
 */
export async function resolveBoingBlobDisplayUrl(uri, opts = {}) {
  const idHex = blobIdHexFromBoingUri(String(uri || '').trim());
  if (!idHex) return null;
  const cached = cache.get(idHex);
  if (cached) return cached;

  const client = opts.client || getSharedBoingClient();
  const res = await client.getBlob(idHex);
  if (!res) return null;
  const bytes = dataHexToBytes(/** @type {{ dataHex?: string, data?: string }} */ (res).dataHex
    ?? /** @type {{ data?: string }} */ (res).data);
  if (!bytes || bytes.length === 0) return null;

  const meta = /** @type {{ meta?: { contentType?: string, content_type?: string } }} */ (res).meta;
  const ct =
    opts.contentType ||
    meta?.contentType ||
    meta?.content_type ||
    'application/octet-stream';
  const url = URL.createObjectURL(new Blob([bytes], { type: ct }));
  cache.set(idHex, url);
  return url;
}

/** Drop a cached object URL (revoke). */
export function forgetBoingBlobDisplayUrl(uri) {
  const idHex = blobIdHexFromBoingUri(String(uri || '').trim());
  if (!idHex) return;
  const url = cache.get(idHex);
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
    cache.delete(idHex);
  }
}
