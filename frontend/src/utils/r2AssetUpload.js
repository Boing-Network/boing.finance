/**
 * Upload images / JSON metadata to the Finance API Worker (Cloudflare R2).
 * Used by Create Token logos and launch metadata (`description_hash` commitments).
 */
import { apiPath } from '../config.js';
import logger from './logger.js';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/**
 * Prefer a public https URL from an R2 / IPFS upload result.
 * @param {unknown} result
 * @returns {string}
 */
export function publicAssetUri(result) {
  if (!result) return '';
  if (typeof result === 'string') {
    const t = result.trim();
    if (!t) return '';
    if (/^(https?:\/\/|ipfs:\/\/)/i.test(t)) return t;
    return `ipfs://${t}`;
  }
  const raw = String(result.url || result.gatewayUrls?.[0] || '').trim();
  if (/^(https?:\/\/|ipfs:\/\/)/i.test(raw)) return raw;
  const hash = String(result.hash || raw || '').trim();
  if (!hash) return '';
  return hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
}

export function isPublicAssetUri(value) {
  return /^(https?:\/\/|ipfs:\/\/)/i.test(String(value || '').trim());
}

/**
 * @param {File|Blob} file
 * @param {{ canonicalKey?: string }} [options]
 */
export async function uploadFileToR2(file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (options.canonicalKey) {
    formData.append('canonicalKey', options.canonicalKey);
  }

  logger.debug?.('R2 file upload starting');
  const response = await fetch(apiPath('r2/upload'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`R2 upload failed (${response.status})${errorText ? `: ${errorText}` : ''}`);
  }
  const result = await response.json();
  if (!result?.success || !result.data) {
    throw new Error(result?.error || 'R2 upload failed: invalid response');
  }
  return result.data;
}

/**
 * Upload JSON metadata. When `canonicalKey` is `metadata/{blake3}.json`, the Worker
 * dual-writes a content-addressed copy so explorers can resolve `description_hash`.
 * @param {object} metadata
 * @param {{ canonicalKey?: string }} [options]
 */
export async function uploadMetadataToR2(metadata, options = {}) {
  const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });
  return uploadFileToR2(file, options);
}

/**
 * @param {File} file
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateTokenLogoFile(file) {
  if (!file || typeof file !== 'object') {
    return { ok: false, message: 'Choose an image file.' };
  }
  const type = String(file.type || '').toLowerCase();
  if (!type.startsWith('image/')) {
    return { ok: false, message: 'Logo must be an image (PNG, JPG, GIF, WebP, or SVG).' };
  }
  if (typeof file.size === 'number' && file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: 'Logo must be 5 MB or smaller.' };
  }
  return { ok: true };
}

export { MAX_LOGO_BYTES };
