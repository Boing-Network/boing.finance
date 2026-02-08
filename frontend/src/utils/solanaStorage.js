/**
 * Solana Storage Utility - R2 for images and metadata
 * Uses backend R2 API for industry-standard, secure storage
 * All uploads return public HTTPS URLs (no IPFS required)
 */
const getBackendUrl = () => process.env.REACT_APP_BACKEND_URL || 'http://localhost:8787';

/**
 * Upload file (image) to R2 via backend - returns public URL
 * @param {File} file
 * @returns {{ url: string, hash?: string, gatewayUrls?: string[] }}
 */
export async function uploadToR2ForSolana(file) {
  const backendUrl = getBackendUrl();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${backendUrl}/api/r2/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`R2 upload failed: ${response.status} - ${err}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) throw new Error('R2 upload invalid response');

  const data = result.data;
  const url = data.url || data.gatewayUrls?.[0];
  if (!url) throw new Error('No URL returned from R2 upload');
  return { url, hash: data.hash, gatewayUrls: data.gatewayUrls };
}

/**
 * Upload metadata JSON to R2 via backend - returns public URL
 * @param {object} metadata - Metaplex-compatible metadata
 * @returns {{ url: string }}
 */
export async function uploadMetadataToR2ForSolana(metadata) {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/r2/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Metadata upload failed: ${response.status} - ${err}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) throw new Error('Metadata upload invalid response');

  const data = result.data;
  const url = data.url || data.gatewayUrls?.[0];
  if (!url) throw new Error('No URL returned from metadata upload');
  return { url };
}
