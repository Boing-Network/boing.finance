/**
 * Large-set NFT media upload product limits.
 * Server mirrors these via GET /api/r2/upload-limits and NFT_MEDIA_BUDGET_GB.
 */

const GB = 1024 * 1024 * 1024;

function parseBudgetGb() {
  const raw = Number(process.env.REACT_APP_NFT_MEDIA_BUDGET_GB);
  if (Number.isFinite(raw) && raw > 0 && raw <= 50) return raw;
  return 50;
}

/** Product collection media budget (default 50 GiB). Override with REACT_APP_NFT_MEDIA_BUDGET_GB (1–50). */
export const NFT_MEDIA_BUDGET_GB = parseBudgetGb();
export const NFT_MEDIA_BUDGET_BYTES = Math.floor(NFT_MEDIA_BUDGET_GB * GB);

/** Prefer multipart above this size (aligns with raised simple PUT). */
export const NFT_SIMPLE_UPLOAD_MAX_BYTES = 32 * 1024 * 1024;

/** Chunk size for Worker-proxied R2 multipart parts. */
export const NFT_UPLOAD_PART_BYTES = 8 * 1024 * 1024;

/** Per-file cap for large-set media (multipart). */
export const NFT_LARGE_FILE_MAX_BYTES = 512 * 1024 * 1024;

/** Max CSV / media rows for large set. */
export const NFT_LARGE_SET_MAX_ROWS = 10000;

/**
 * Parallel file uploads in the browser (Worker → R2).
 * HTTP/2 to Cloudflare allows more than classic per-host connection limits.
 * Override with REACT_APP_NFT_UPLOAD_CONCURRENCY (1–16).
 */
function parseUploadConcurrency() {
  const raw = Number(process.env.REACT_APP_NFT_UPLOAD_CONCURRENCY);
  if (Number.isFinite(raw) && raw >= 1 && raw <= 16) return Math.trunc(raw);
  return 8;
}
export const NFT_UPLOAD_CONCURRENCY = parseUploadConcurrency();

/**
 * Without a PutBlob publish session (Express 0.1.22+), warn that each file needs
 * a wallet approval. Sessions remove the per-file popup; this is not a hard cap.
 */
export const NFT_L1_PER_FILE_APPROVAL_WARN_AT = 24;

export function formatBytes(n) {
  const bytes = Number(n) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}
