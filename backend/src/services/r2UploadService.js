// R2 Upload Service for Cloudflare R2 Object Storage
// Handles file uploads, metadata storage, and IPFS-like functionality

export class R2UploadService {
  constructor(r2Bucket, options = {}) {
    this.bucket = r2Bucket;
    // Use the new public development URL for the R2 bucket
    this.baseUrl = 'https://pub-fdf80a26d0d54acd86aa835377381ea3.r2.dev';
    // Worker URL for serving files through the API
    this.workerUrl = options.workerUrl || null;
  }

  // Upload a file to R2 and return metadata
  async uploadFile(file, metadata = {}) {
    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = this.getFileExtension(file.name);
      const fileName = `uploads/${timestamp}-${randomId}${fileExtension}`;
      
      // Prepare file metadata
      const fileMetadata = {
        originalName: file.name,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        ...metadata
      };

      // Upload to R2
      await this.bucket.put(fileName, file, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: fileMetadata
      });

      // Return IPFS-like response with multiple URL options
      const fileUrl = `${this.baseUrl}/${fileName}`;
      const workerUrl = this.workerUrl 
        ? `${this.workerUrl}/api/r2/file/${fileName}`
        : null;
      const ipfsHash = this.generateIPFSHash(fileName); // Generate a hash for compatibility

      // Build gateway URLs array
      const gatewayUrls = [fileUrl]; // Public R2 URL (primary)
      if (workerUrl) {
        gatewayUrls.push(workerUrl); // Worker URL (fallback)
      }

      console.log('R2 upload successful:', {
        fileName,
        fileUrl,
        workerUrl,
        metadata: fileMetadata
      });

      return {
        hash: ipfsHash,
        url: fileUrl, // Use public R2 URL as primary
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrls,
        metadata: fileMetadata,
        fileName: fileName
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`R2 upload failed: ${error.message}`);
    }
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
  validateFile(file, maxSize = 10 * 1024 * 1024) { // 10MB default
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/json' // Allow JSON for metadata
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} bytes exceeds maximum allowed size of ${maxSize} bytes`);
    }

    return true;
  }

  // Get public URL for a file
  getPublicUrl(fileName) {
    return `${this.baseUrl}/${fileName}`;
  }
} 