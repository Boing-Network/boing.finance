/**
 * Chunked R2 upload via finance Worker multipart API.
 * Parts go Browser → Worker → R2 binding (not browser-presigned S3 URLs).
 */

import { apiPath } from '../config';
import {
  NFT_SIMPLE_UPLOAD_MAX_BYTES,
  NFT_UPLOAD_PART_BYTES,
  NFT_LARGE_FILE_MAX_BYTES,
  NFT_UPLOAD_CONCURRENCY,
  formatBytes,
} from '../config/nftUploadLimits';
import { publicAssetUri } from './nftCollectionMetadata';

async function readJson(res) {
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.details || `HTTP ${res.status}`);
  }
  return json;
}

/** Simple FormData PUT for small files (existing /api/r2/upload). */
async function uploadSimple(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(apiPath('r2/upload'), { method: 'POST', body: formData });
  const result = await readJson(response);
  return result.data;
}

async function createMultipart(file) {
  const response = await fetch(apiPath('r2/multipart/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    }),
  });
  const result = await readJson(response);
  return result.data;
}

async function uploadPart({ key, uploadId, partNumber, blob }) {
  const qs = new URLSearchParams({
    key,
    uploadId,
    partNumber: String(partNumber),
  });
  const response = await fetch(`${apiPath('r2/multipart/part')}?${qs}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-r2-key': key,
      'x-r2-upload-id': uploadId,
      'x-r2-part-number': String(partNumber),
    },
    body: blob,
  });
  const result = await readJson(response);
  return result.data;
}

async function completeMultipart({ key, uploadId, parts, file }) {
  const response = await fetch(apiPath('r2/multipart/complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      uploadId,
      parts,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    }),
  });
  const result = await readJson(response);
  return result.data;
}

async function abortMultipart({ key, uploadId }) {
  try {
    await fetch(apiPath('r2/multipart/abort'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId }),
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Upload one file; uses simple POST under threshold, else chunked multipart.
 * @param {File} file
 * @param {{ onProgress?: (p: { loaded: number, total: number, ratio: number }) => void }} [opts]
 */
export async function uploadFileToR2Chunked(file, opts = {}) {
  const { onProgress } = opts;
  if (!file) throw new Error('No file');
  if (file.size > NFT_LARGE_FILE_MAX_BYTES) {
    throw new Error(`File exceeds max ${formatBytes(NFT_LARGE_FILE_MAX_BYTES)} (${file.name})`);
  }

  if (file.size <= NFT_SIMPLE_UPLOAD_MAX_BYTES) {
    const data = await uploadSimple(file);
    onProgress?.({ loaded: file.size, total: file.size, ratio: 1 });
    return data;
  }

  const created = await createMultipart(file);
  const { key, uploadId } = created;
  const partSize = Math.min(
    Number(created.partMaxBytes) || NFT_UPLOAD_PART_BYTES,
    NFT_UPLOAD_PART_BYTES
  );
  const parts = [];
  let loaded = 0;

  try {
    let partNumber = 1;
    for (let offset = 0; offset < file.size; offset += partSize, partNumber += 1) {
      const chunk = file.slice(offset, Math.min(offset + partSize, file.size));
      const uploaded = await uploadPart({ key, uploadId, partNumber, blob: chunk });
      parts.push({ partNumber: uploaded.partNumber, etag: uploaded.etag });
      loaded += chunk.size;
      onProgress?.({
        loaded,
        total: file.size,
        ratio: file.size ? loaded / file.size : 1,
      });
    }
    return await completeMultipart({ key, uploadId, parts, file });
  } catch (err) {
    await abortMultipart({ key, uploadId });
    throw err;
  }
}

/**
 * Upload many files with concurrency + aggregate progress.
 * @returns {Promise<{ results: Array<{ file: File, uri: string, data: object }>, failures: Array<{ file: File, error: string }> }>}
 */
export async function uploadFilesToR2Chunked(files, opts = {}) {
  const list = Array.from(files || []);
  const concurrency = Math.max(1, Number(opts.concurrency) || NFT_UPLOAD_CONCURRENCY);
  const onFileProgress = opts.onFileProgress;
  const onTotalProgress = opts.onTotalProgress;

  const totalBytes = list.reduce((s, f) => s + (f.size || 0), 0);
  const loadedByName = new Map();
  const results = [];
  const failures = [];
  let index = 0;

  const bumpTotal = () => {
    let loaded = 0;
    for (const v of loadedByName.values()) loaded += v;
    onTotalProgress?.({
      loaded,
      total: totalBytes,
      ratio: totalBytes ? loaded / totalBytes : 1,
      completed: results.length,
      failed: failures.length,
      remaining: list.length - results.length - failures.length,
    });
  };

  async function worker() {
    while (index < list.length) {
      const i = index;
      index += 1;
      const file = list[i];
      loadedByName.set(file.name + i, 0);
      try {
        const data = await uploadFileToR2Chunked(file, {
          onProgress: (p) => {
            loadedByName.set(file.name + i, p.loaded);
            onFileProgress?.({ file, index: i, ...p });
            bumpTotal();
          },
        });
        const uri = publicAssetUri(data);
        if (!uri) throw new Error('Upload returned no public URL');
        results.push({ file, uri, data });
        loadedByName.set(file.name + i, file.size);
      } catch (e) {
        failures.push({ file, error: e?.message || String(e) });
      }
      bumpTotal();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, () => worker()));
  return { results, failures };
}

export { formatBytes };
