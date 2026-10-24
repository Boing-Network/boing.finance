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
import { uploadToIPFS } from '../utils/ipfsUpload';
import { publicAssetUri } from '../utils/nftCollectionMetadata';
import { uploadFileToR2Chunked } from '../utils/r2ChunkedUpload';

/** Practical wallet postMessage ceiling for hex-encoded PutBlob bodies (raw bytes). */
export const L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES = 4 * 1024 * 1024;

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
  const nonce = await fetchBoingAccountNonceString(senderHex, { signal });
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
 * Upload many files preferring L1 (sequential PutBlob approvals), else R2 chunked.
 * @param {File[]} files
 * @param {{
 *   preferL1?: boolean,
 *   provider?: { request: Function } | null,
 *   senderHex?: string | null,
 *   onProgress?: (p: object) => void,
 *   signal?: AbortSignal,
 * }} [opts]
 */
export async function uploadNftMediaFilesPreferL1(files, opts = {}) {
  const list = Array.from(files || []);
  const results = [];
  const failures = [];
  const totalBytes = list.reduce((s, f) => s + (f.size || 0), 0);
  let loaded = 0;
  let maxBytes = opts.maxBytes;
  if (maxBytes == null && opts.preferL1 !== false) {
    try {
      maxBytes = (await resolveMediaBlobMaxBytes()).maxBytes;
    } catch {
      maxBytes = MAX_MEDIA_BLOB_BYTES;
    }
  }

  for (let i = 0; i < list.length; i += 1) {
    const file = list[i];
    try {
      const out = await uploadNftMediaPreferL1(file, {
        preferL1: opts.preferL1,
        provider: opts.provider,
        senderHex: opts.senderHex,
        maxBytes,
        useChunkedR2: true,
        signal: opts.signal,
      });
      results.push({ file, uri: out.uri, storage: out.storage, blobIdHex: out.blobIdHex });
      loaded += file.size || 0;
      opts.onProgress?.({
        loaded,
        total: totalBytes,
        ratio: totalBytes ? loaded / totalBytes : 1,
        completed: results.length,
        failed: failures.length,
        remaining: list.length - results.length - failures.length,
        current: file.name,
        storage: out.storage,
      });
    } catch (e) {
      failures.push({ file, error: e?.message || String(e) });
      opts.onProgress?.({
        loaded,
        total: totalBytes,
        ratio: totalBytes ? loaded / totalBytes : 1,
        completed: results.length,
        failed: failures.length,
        remaining: list.length - results.length - failures.length,
      });
    }
  }

  return { results, failures };
}
