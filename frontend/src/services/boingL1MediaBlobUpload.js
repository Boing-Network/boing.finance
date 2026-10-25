/**
 * Upload NFT media bytes as Boing L1 media blobs (PutBlob), with R2/HTTP fallback.
 * Image URIs use `boing://blob/0x{id}` which marketplaces resolve via `boing_getBlob`.
 */

import {
  MAX_MEDIA_BLOB_BYTES,
  blobIdOf,
  bytesToHex,
  mediaBlobMaxBytesAt,
  mediaBlobUri,
} from '@boing-network/boing-sdk';
import { getSharedBoingClient } from './boingNativeDexClient';
import {
  boingExpressSendTransaction,
  fetchBoingAccountNonceString,
  withBoingAccountNonce,
} from './boingExpressNativeTx';
import { waitForBoingAccountNonceAtLeast } from './boingDeployReceiptFollowup';
import { NFT_UPLOAD_CONCURRENCY } from '../config/nftUploadLimits';
import { uploadToIPFS } from '../utils/ipfsUpload';
import { publicAssetUri } from '../utils/nftCollectionMetadata';
import { uploadFileToR2Chunked, uploadFilesToR2Chunked } from '../utils/r2ChunkedUpload';

/** Practical wallet postMessage ceiling for hex-encoded PutBlob bodies (raw bytes). */
export const L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Express 0.1.22+ `putBlobSession` — one approval covering many PutBlob sends.
 * @param {{ request?: Function, features?: string[] } | null | undefined} provider
 */
export async function providerSupportsPutBlobSession(provider) {
  if (!provider || typeof provider.request !== 'function') return false;
  if (Array.isArray(provider.features) && provider.features.includes('putBlobSession')) {
    return true;
  }
  try {
    const caps = await Promise.race([
      provider.request({ method: 'boing_getCapabilities', params: [] }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
    return Array.isArray(caps?.features) && caps.features.includes('putBlobSession');
  } catch {
    return false;
  }
}

/**
 * Request a PutBlob publish session (one wallet approval).
 * @returns {Promise<object | null>} session public shape, or null if unsupported / rejected
 */
export async function requestNftPutBlobSession(provider, opts = {}) {
  if (!(await providerSupportsPutBlobSession(provider))) return null;
  const maxBlobs = Math.max(1, Math.trunc(Number(opts.maxBlobs) || 1));
  const maxTotalBytes = Math.max(
    1,
    Math.trunc(Number(opts.maxTotalBytes) || maxBlobs * L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES),
  );
  try {
    return await provider.request({
      method: 'boing_requestPutBlobSession',
      params: [
        {
          maxBlobs,
          maxTotalBytes,
          maxBytesPerBlob: L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES,
          ttlMs: opts.ttlMs,
        },
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/4001|rejected|denied|User rejected/i.test(msg)) throw err;
    return null;
  }
}

/**
 * Read live PutBlob size cap from `boing_getMediaBlobParams` (falls back to SDK defaults).
 * @param {import('@boing-network/boing-sdk').BoingClient} [client]
 * @returns {Promise<{ maxBytes: number, phase7CapActive: boolean, source: string }>}
 */
export async function resolveMediaBlobMaxBytes(client = getSharedBoingClient()) {
  try {
    const params = await client.getMediaBlobParams();
    const tip = Number(
      params?.effectiveMaxBytesAtTip ??
        params?.effective_max_bytes_at_tip ??
        params?.maxBytes ??
        params?.max_bytes,
    );
    const phase7 =
      params?.phase7CapActiveAtTip === true ||
      params?.phase7_cap_active_at_tip === true ||
      tip >= mediaBlobMaxBytesAt(true);
    if (Number.isFinite(tip) && tip > 0) {
      return { maxBytes: Math.trunc(tip), phase7CapActive: phase7, source: 'rpc' };
    }
    return {
      maxBytes: mediaBlobMaxBytesAt(phase7),
      phase7CapActive: phase7,
      source: 'rpc-derived',
    };
  } catch {
    return { maxBytes: MAX_MEDIA_BLOB_BYTES, phase7CapActive: false, source: 'sdk-default' };
  }
}

/**
 * @param {File | Blob} file
 * @returns {Promise<Uint8Array>}
 */
async function fileToBytes(file) {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * PutBlob via Boing Express (`type: put_blob`). Returns `boing://blob/0x…`.
 * @param {{
 *   file: File | Blob,
 *   provider: { request: Function },
 *   senderHex: string,
 *   contentType?: string,
 *   retention?: { kind: 'forever' } | { kind: 'prunable', ttl_blocks?: string | number },
 *   maxBytes?: number,
 *   waitForInclusion?: boolean,
 *   signal?: AbortSignal,
 * }} opts
 */
export async function putNftMediaAsL1Blob(opts) {
  const {
    file,
    provider,
    senderHex,
    contentType,
    retention = { kind: 'forever' },
    waitForInclusion = true,
    signal,
  } = opts;
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Boing Express provider required for L1 media blobs');
  }
  if (!senderHex) throw new Error('sender account required for L1 media blobs');

  const data = await fileToBytes(file);
  const cap =
    Number.isFinite(opts.maxBytes) && opts.maxBytes > 0
      ? Math.trunc(opts.maxBytes)
      : (await resolveMediaBlobMaxBytes()).maxBytes;
  if (data.length === 0) throw new Error('Empty media file');
  if (data.length > cap) {
    throw new Error(`Media exceeds L1 blob cap (${cap} bytes)`);
  }
  if (data.length > L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES) {
    throw new Error(
      `Media too large for wallet PutBlob (${data.length} > ${L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES}); use R2 fallback`,
    );
  }

  const ct =
    (contentType || (file && 'type' in file && file.type) || 'application/octet-stream').slice(0, 64);
  const id = blobIdOf(data);
  const uri = mediaBlobUri(id);
  const nonce =
    opts.nonce != null && String(opts.nonce).trim() !== ''
      ? String(opts.nonce)
      : await fetchBoingAccountNonceString(senderHex, { signal });
  const txObject = withBoingAccountNonce(
    {
      type: 'put_blob',
      from: senderHex,
      retention,
      content_type: ct,
      data: bytesToHex(data),
      access_list: { read: [senderHex], write: [senderHex] },
    },
    nonce,
  );

  const hash = await boingExpressSendTransaction(provider, txObject, {
    senderHex,
    refreshNonce: false,
    waitForInclusion: false,
    signal,
  });

  if (waitForInclusion) {
    const used = Number(nonce);
    if (Number.isFinite(used)) {
      await waitForBoingAccountNonceAtLeast(senderHex, used + 1, {
        signal,
        maxAttempts: 48,
        delayMs: 1200,
      });
    }
  }

  return {
    uri,
    blobIdHex: bytesToHex(id),
    size: data.length,
    contentType: ct,
    txHash: typeof hash === 'string' ? hash : String(hash),
    storage: 'l1',
    nonce,
  };
}

/**
 * Prefer L1 PutBlob when Express + size allow; otherwise R2/IPFS.
 * @param {File} file
 * @param {{
 *   preferL1?: boolean,
 *   provider?: { request: Function } | null,
 *   senderHex?: string | null,
 *   maxBytes?: number,
 *   useChunkedR2?: boolean,
 *   onL1Attempt?: () => void,
 *   onFallback?: (reason: string) => void,
 *   signal?: AbortSignal,
 * }} [opts]
 * @returns {Promise<{ uri: string, storage: 'l1' | 'r2' | 'ipfs', blobIdHex?: string, fallbackReason?: string }>}
 */
export async function uploadNftMediaPreferL1(file, opts = {}) {
  const preferL1 = opts.preferL1 !== false;
  const provider = opts.provider;
  const senderHex = opts.senderHex;

  if (preferL1 && provider && senderHex) {
    try {
      opts.onL1Attempt?.();
      const maxBytes =
        opts.maxBytes ??
        (await resolveMediaBlobMaxBytes()).maxBytes;
      const put = await putNftMediaAsL1Blob({
        file,
        provider,
        senderHex,
        maxBytes,
        signal: opts.signal,
      });
      return {
        uri: put.uri,
        storage: 'l1',
        blobIdHex: put.blobIdHex,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      opts.onFallback?.(reason);
    }
  } else if (preferL1) {
    opts.onFallback?.(
      !provider || !senderHex
        ? 'Boing Express not connected — using R2/HTTP'
        : 'L1 upload skipped',
    );
  }

  if (opts.useChunkedR2) {
    const data = await uploadFileToR2Chunked(file);
    const uri = publicAssetUri(data);
    if (!uri) throw new Error('R2 upload returned no public URL');
    return { uri, storage: 'r2', fallbackReason: 'r2-chunked' };
  }

  const result = await uploadToIPFS(file);
  const uri = publicAssetUri(result);
  if (!uri) throw new Error('Upload returned no public URL');
  const storage = /^ipfs:\/\//i.test(uri) ? 'ipfs' : 'r2';
  return { uri, storage, fallbackReason: 'off-chain' };
}

/**
 * Prefer L1 when the wizard asks for it and Express + sender are present.
 * @param {number} pendingCount
 * @param {{ preferL1?: boolean, provider?: unknown, senderHex?: string | null }} [opts]
 */
export function shouldPreferL1ForBulk(pendingCount, opts = {}) {
  return (
    opts.preferL1 === true &&
    Boolean(opts.provider) &&
    Boolean(opts.senderHex) &&
    pendingCount > 0
  );
}

/**
 * Upload many files. Default product path: L1 PutBlob (with Express PutBlob
 * session = one wallet approval for the whole set). Concurrent R2 when L1 is off
 * or Express is unavailable. Skips files already present in `existingUriByName`.
 * @param {File[]} files
 * @param {{
 *   preferL1?: boolean,
 *   provider?: { request: Function } | null,
 *   senderHex?: string | null,
 *   existingUriByName?: Record<string, string>,
 *   concurrency?: number,
 *   onProgress?: (p: object) => void,
 *   onL1ForcedOff?: (reason: string) => void,
 *   onPutBlobSession?: (info: { ok: boolean, reason?: string }) => void,
 *   signal?: AbortSignal,
 * }} [opts]
 */
export async function uploadNftMediaFilesPreferL1(files, opts = {}) {
  const list = Array.from(files || []);
  const existing = opts.existingUriByName || {};
  const results = [];
  const failures = [];
  const pending = [];

  for (const file of list) {
    const key = String(file?.name || '').toLowerCase();
    const prior = key && existing[key];
    if (prior && typeof prior === 'string' && prior.trim()) {
      results.push({ file, uri: prior.trim(), storage: 'cached', skipped: true });
      continue;
    }
    pending.push(file);
  }

  const skippedBytes = results.reduce((s, r) => s + (r.file?.size || 0), 0);
  const totalBytes = list.reduce((s, f) => s + (f.size || 0), 0);
  const emit = (extra = {}) => {
    const completed = results.length;
    const failed = failures.length;
    const loaded =
      skippedBytes +
      (Number.isFinite(extra.loadedPending) ? extra.loadedPending : 0);
    opts.onProgress?.({
      loaded: Math.min(loaded, totalBytes),
      total: totalBytes,
      ratio: totalBytes ? Math.min(loaded, totalBytes) / totalBytes : 1,
      completed,
      failed,
      remaining: list.length - completed - failed,
      skipped: results.filter((r) => r.skipped).length,
      ...extra,
    });
  };
  emit({ loadedPending: 0 });

  if (pending.length === 0) {
    return { results, failures, usedL1: false, forcedR2: false, putBlobSession: false };
  }

  const wantL1 = opts.preferL1 === true;
  const useL1 = shouldPreferL1ForBulk(pending.length, opts);
  if (wantL1 && !useL1) {
    opts.onL1ForcedOff?.(
      !opts.provider || !opts.senderHex
        ? 'Boing Express not connected — using parallel R2'
        : 'Using parallel R2 uploads',
    );
  }

  if (!useL1) {
    const concurrency = Math.max(
      1,
      Number(opts.concurrency) || NFT_UPLOAD_CONCURRENCY,
    );
    const { results: r2Results, failures: r2Failures } = await uploadFilesToR2Chunked(
      pending,
      {
        concurrency,
        onTotalProgress: (p) => {
          emit({
            loadedPending: p.loaded || 0,
            current: undefined,
            storage: 'r2',
            concurrency,
          });
        },
      },
    );
    for (const row of r2Results) {
      results.push({
        file: row.file,
        uri: row.uri,
        storage: 'r2',
        data: row.data,
      });
    }
    for (const row of r2Failures) {
      failures.push(row);
    }
    emit({
      loadedPending: pending.reduce((s, f) => s + (f.size || 0), 0),
      storage: 'r2',
      concurrency,
    });
    return {
      results,
      failures,
      usedL1: false,
      forcedR2: wantL1,
      putBlobSession: false,
    };
  }

  let maxBytes = opts.maxBytes;
  if (maxBytes == null) {
    try {
      maxBytes = (await resolveMediaBlobMaxBytes()).maxBytes;
    } catch {
      maxBytes = MAX_MEDIA_BLOB_BYTES;
    }
  }

  const pendingBytes = pending.reduce((s, f) => s + (f.size || 0), 0);
  let putBlobSession = false;
  if (pending.length >= 2) {
    try {
      const session = await requestNftPutBlobSession(opts.provider, {
        maxBlobs: pending.length,
        maxTotalBytes: Math.max(pendingBytes, pending.length),
      });
      putBlobSession = Boolean(session?.sessionId || session?.maxBlobs);
      opts.onPutBlobSession?.({
        ok: putBlobSession,
        reason: putBlobSession
          ? 'One wallet approval covers this L1 media set'
          : 'Express PutBlob session unavailable — each file may need approval (update Boing Express)',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/4001|rejected|denied|User rejected/i.test(msg)) throw err;
      opts.onPutBlobSession?.({ ok: false, reason: msg });
    }
  }

  let nonceStr = await fetchBoingAccountNonceString(opts.senderHex, {
    signal: opts.signal,
  });
  let nonceNum = Number(nonceStr);
  if (!Number.isFinite(nonceNum)) {
    throw new Error('Could not read account nonce for L1 media upload');
  }

  let loadedPending = 0;
  let lastNonceUsed = null;
  for (let i = 0; i < pending.length; i += 1) {
    const file = pending[i];
    try {
      const put = await putNftMediaAsL1Blob({
        file,
        provider: opts.provider,
        senderHex: opts.senderHex,
        maxBytes,
        nonce: String(nonceNum),
        waitForInclusion: false,
        signal: opts.signal,
      });
      results.push({
        file,
        uri: put.uri,
        storage: 'l1',
        blobIdHex: put.blobIdHex,
      });
      lastNonceUsed = nonceNum;
      nonceNum += 1;
      loadedPending += file.size || 0;
      emit({
        loadedPending,
        current: file.name,
        storage: 'l1',
        putBlobSession,
      });
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      // Fall back to R2 for this file (size / wallet / session exhaustion).
      try {
        opts.onFallback?.(reason);
        const data = await uploadFileToR2Chunked(file);
        const uri = publicAssetUri(data);
        if (!uri) throw new Error('R2 upload returned no public URL');
        results.push({ file, uri, storage: 'r2', fallbackReason: reason });
        loadedPending += file.size || 0;
        emit({
          loadedPending,
          current: file.name,
          storage: 'r2',
          putBlobSession,
        });
      } catch (e2) {
        failures.push({ file, error: e2?.message || String(e2) });
        emit({ loadedPending, current: file.name, putBlobSession });
      }
      // Refresh nonce after a failed PutBlob so the next attempt stays in sync.
      try {
        nonceStr = await fetchBoingAccountNonceString(opts.senderHex, {
          signal: opts.signal,
        });
        const refreshed = Number(nonceStr);
        if (Number.isFinite(refreshed)) nonceNum = refreshed;
      } catch {
        /* keep local counter */
      }
    }
  }

  if (lastNonceUsed != null) {
    try {
      await waitForBoingAccountNonceAtLeast(opts.senderHex, lastNonceUsed + 1, {
        signal: opts.signal,
        maxAttempts: 64,
        delayMs: 1000,
      });
    } catch {
      /* best-effort inclusion wait */
    }
  }

  try {
    if (putBlobSession && opts.provider?.request) {
      await opts.provider.request({ method: 'boing_endPutBlobSession', params: [] });
    }
  } catch {
    /* ignore */
  }

  return { results, failures, usedL1: true, forcedR2: false, putBlobSession };
}
