// R2 Upload Service for Cloudflare R2 Object Storage
// Handles file uploads, metadata storage, and IPFS-like functionality

/** Default single-request upload cap (legacy /r2/upload). */
export const R2_SIMPLE_MAX_BYTES = 32 * 1024 * 1024; // 32 MiB
/** Max size of one multipart part body (must stay under Worker request limits). */
export const R2_PART_MAX_BYTES = 16 * 1024 * 1024; // 16 MiB
/** Per-object cap via multipart (product files stay well under this). */
export const R2_MULTIPART_OBJECT_MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GiB
/** Collection media budget default (product UX); override with NFT_MEDIA_BUDGET_GB. */
export const R2_COLLECTION_BUDGET_DEFAULT_GB = 50;

const IMAGE_AND_META_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/json',
];

export class R2UploadService {
  constructor(r2Bucket, options = {}) {
    this.bucket = r2Bucket;
    // Use the new public development URL for the R2 bucket
    this.baseUrl = 'https://pub-fdf80a26d0d54acd86aa835377381ea3.r2.dev';
    // Worker URL for serving files through the API
    this.workerUrl = options.workerUrl || null;
  }

  buildUploadKey(originalName) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = this.getFileExtension(originalName || '');
    return `uploads/${timestamp}-${randomId}${fileExtension}`;
  }

  buildUploadResult(fileName, fileMetadata) {
    const fileUrl = `${this.baseUrl}/${fileName}`;
    const workerUrl = this.workerUrl
      ? `${this.workerUrl}/api/r2/file/${fileName}`
      : null;
    const ipfsHash = this.generateIPFSHash(fileName);
    const gatewayUrls = [fileUrl];
    if (workerUrl) gatewayUrls.push(workerUrl);
    return {
      hash: ipfsHash,
      url: fileUrl,
      ipfsUrl: `ipfs://${ipfsHash}`,
      gatewayUrls,
      metadata: fileMetadata,
      fileName,
    };
  }

  // Upload a file to R2 and return metadata
  async uploadFile(file, metadata = {}) {
    try {
      const fileName = this.buildUploadKey(file.name);
      const fileMetadata = {
        originalName: file.name,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        ...metadata
      };

      await this.bucket.put(fileName, file, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: fileMetadata
      });

      const result = this.buildUploadResult(fileName, fileMetadata);
      console.log('R2 upload successful:', {
        fileName,
        fileUrl: result.url,
        workerUrl: result.gatewayUrls?.[1] || null,
        metadata: fileMetadata
      });
      return result;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Start an R2 multipart upload (Worker-proxied parts — not S3 presigned URLs).
   * Needed for objects larger than the simple PUT / Worker single-request comfort zone.
   */
  async createMultipartUpload(originalName, contentType = 'application/octet-stream', metadata = {}) {
    const fileName = this.buildUploadKey(originalName);
    const multipart = await this.bucket.createMultipartUpload(fileName, {
      httpMetadata: {
        contentType: contentType || 'application/octet-stream',
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        originalName: String(originalName || 'upload').slice(0, 200),
        uploadedAt: new Date().toISOString(),
        ...Object.fromEntries(
          Object.entries(metadata || {}).map(([k, v]) => [String(k).slice(0, 64), String(v).slice(0, 256)])
        ),
      },
    });
    return {
      key: multipart.key,
      uploadId: multipart.uploadId,
      partMaxBytes: R2_PART_MAX_BYTES,
      objectMaxBytes: R2_MULTIPART_OBJECT_MAX_BYTES,
    };
  }

  async uploadMultipartPart(key, uploadId, partNumber, body) {
    const part = Number(partNumber);
    if (!Number.isInteger(part) || part < 1 || part > 10000) {
      throw new Error('Invalid partNumber');
    }
    if (!key || !uploadId) {
      throw new Error('key and uploadId are required');
    }
    const multipart = this.bucket.resumeMultipartUpload(key, uploadId);
    const uploaded = await multipart.uploadPart(part, body);
    return { partNumber: part, etag: uploaded.etag };
  }

  async completeMultipartUpload(key, uploadId, parts, fileMeta = {}) {
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new Error('parts array is required');
    }
    const normalized = parts
      .map((p) => ({
        partNumber: Number(p.partNumber),
        etag: String(p.etag || ''),
      }))
      .filter((p) => Number.isInteger(p.partNumber) && p.partNumber >= 1 && p.etag);
    if (normalized.length === 0) {
      throw new Error('No valid parts');
    }
    normalized.sort((a, b) => a.partNumber - b.partNumber);
    const multipart = this.bucket.resumeMultipartUpload(key, uploadId);
    await multipart.complete(normalized);
    const size = Number(fileMeta.size) || 0;
    const fileMetadata = {
      originalName: fileMeta.originalName || key.split('/').pop(),
      contentType: fileMeta.contentType || 'application/octet-stream',
      size,
      uploadedAt: new Date().toISOString(),
      multipart: '1',
    };
    return this.buildUploadResult(key, fileMetadata);
  }

  async abortMultipartUpload(key, uploadId) {
    const multipart = this.bucket.resumeMultipartUpload(key, uploadId);
    await multipart.abort();
    return { success: true };
  }

  // Upload metadata as JSON
  async uploadMetadata(metadata, fileName = null) {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const metadataFileName = fileName || `metadata/${timestamp}-${randomId}.json`;
      
      // Add metadata about the metadata
      const enrichedMetadata = {
        ...metadata,
        _uploadedAt: new Date().toISOString(),
        _version: '1.0.0'
      };

      const jsonString = JSON.stringify(enrichedMetadata, null, 2);
      const jsonBuffer = new TextEncoder().encode(jsonString);

      await this.bucket.put(metadataFileName, jsonBuffer, {
        httpMetadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=31536000',
        },
        customMetadata: {
          type: 'metadata',
          uploadedAt: new Date().toISOString()
        }
      });

      const metadataUrl = `${this.baseUrl}/${metadataFileName}`;
      const workerUrl = this.workerUrl 
        ? `${this.workerUrl}/api/r2/file/${metadataFileName}`
        : null;
      const ipfsHash = this.generateIPFSHash(metadataFileName);

      // Build gateway URLs array - prefer worker URL if available, otherwise use R2 public URL
      const gatewayUrls = workerUrl 
        ? [workerUrl, metadataUrl]
        : [metadataUrl];

      return {
        hash: ipfsHash,
        url: workerUrl || metadataUrl, // Use worker URL if available, otherwise R2 public URL
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrls,
        metadata: enrichedMetadata,
        fileName: metadataFileName
      };
    } catch (error) {
      console.error('R2 metadata upload error:', error);
      throw new Error(`R2 metadata upload failed: ${error.message}`);
    }
  }

  // Get file from R2
  async getFile(fileName) {
    try {
      const object = await this.bucket.get(fileName);
      if (!object) {
        throw new Error('File not found');
      }
      return object;
    } catch (error) {
      console.error('R2 get file error:', error);
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  // Delete file from R2
  async deleteFile(fileName) {
    try {
      await this.bucket.delete(fileName);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('R2 delete file error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // List files in R2 bucket (with pagination)
  async listFiles(prefix = '', limit = 100, cursor = null) {
    try {
      const options = {
        prefix,
        limit
      };
      
      if (cursor) {
        options.cursor = cursor;
      }

      const objects = await this.bucket.list(options);
      
      return {
        objects: objects.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          httpMetadata: obj.httpMetadata,
          customMetadata: obj.customMetadata
        })),
        truncated: objects.truncated,
        cursor: objects.cursor
      };
    } catch (error) {
      console.error('R2 list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Generate a hash for IPFS compatibility
  generateIPFSHash(fileName) {
    // Create a deterministic hash based on filename and timestamp
    const hashInput = `${fileName}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `Qm${Math.abs(hash).toString(16).padStart(44, '0')}`;
  }

  // Get file extension
  getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  // Validate file type and size
  validateFile(file, maxSize = R2_SIMPLE_MAX_BYTES) {
    const allowedTypes = IMAGE_AND_META_TYPES;

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} bytes exceeds maximum allowed size of ${maxSize} bytes`);
    }

    return true;
  }

  validateContentType(contentType, { allowBinary = false } = {}) {
    const type = String(contentType || '').toLowerCase();
    if (IMAGE_AND_META_TYPES.includes(type)) return true;
    if (allowBinary && (type.startsWith('image/') || type === 'application/octet-stream')) return true;
    throw new Error(`Content type ${contentType || '(empty)'} is not supported for NFT media upload`);
  }

  // Get public URL for a file
  getPublicUrl(fileName) {
    return `${this.baseUrl}/${fileName}`;
  }

  /**
   * Store compact JSON at a content-addressed key (`metadata/{blake3hex}.json`)
   * so explorers can resolve on-chain `description_hash` without listing the bucket.
   */
  async putCanonicalJson(key, source) {
    if (!/^metadata\/[a-f0-9]{64}\.json$/.test(key)) {
      throw new Error('Invalid canonical metadata key');
    }
    let compact;
    if (typeof source === 'string') {
      compact = source;
    } else if (source && typeof source.text === 'function') {
      const text = await source.text();
      try {
        compact = JSON.stringify(JSON.parse(text));
      } catch {
        compact = text;
      }
    } else {
      compact = JSON.stringify(source);
    }
    const jsonBuffer = new TextEncoder().encode(compact);
    await this.bucket.put(key, jsonBuffer, {
      httpMetadata: {
        contentType: 'application/json',
        cacheControl: 'public, max-age=31536000',
      },
    });
    return `${this.baseUrl}/${key}`;
  }
} 