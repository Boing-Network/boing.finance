import { Hono } from 'hono';
import {
  R2UploadService,
  R2_SIMPLE_MAX_BYTES,
  R2_PART_MAX_BYTES,
  R2_MULTIPART_OBJECT_MAX_BYTES,
  R2_COLLECTION_BUDGET_DEFAULT_GB,
} from '../services/r2UploadService.js';

function getR2Service(c) {
  const workerUrl = c.env.WORKER_URL ||
    (c.req.url ? new URL(c.req.url).origin : null);
  return new R2UploadService(c.env.BOING_STORAGE, { workerUrl });
}

function collectionBudgetBytes(env) {
  const gb = Number(env.NFT_MEDIA_BUDGET_GB);
  const budgetGb = Number.isFinite(gb) && gb > 0 ? gb : R2_COLLECTION_BUDGET_DEFAULT_GB;
  return Math.floor(budgetGb * 1024 * 1024 * 1024);
}

// Create IPFS routes
export const createIPFSRoutes = () => {
  const ipfs = new Hono();

  // Debug middleware to log all requests
  ipfs.use('*', async (c, next) => {
    if ((c.env.NODE_ENV || 'production') !== 'production') {
      console.log(`[IPFS] ${c.req.method} ${c.req.url}`);
    }
    await next();
  });

  // Product limits for large-set CSV + media (client also enforces)
  ipfs.get('/r2/upload-limits', (c) => {
    const budgetBytes = collectionBudgetBytes(c.env);
    return c.json({
      success: true,
      data: {
        simpleMaxBytes: R2_SIMPLE_MAX_BYTES,
        partMaxBytes: R2_PART_MAX_BYTES,
        objectMaxBytes: R2_MULTIPART_OBJECT_MAX_BYTES,
        collectionBudgetBytes: budgetBytes,
        collectionBudgetGb: budgetBytes / (1024 * 1024 * 1024),
        multipartPath: '/api/r2/multipart',
        notes: [
          'Parts are uploaded through this Worker into R2 (createMultipartUpload binding).',
          'True browser→R2 presigned URLs are not exposed; that would need S3 API credentials.',
          'Worker request body limits still apply per part — keep partMaxBytes ≤ ~16–32 MiB.',
        ],
      },
    });
  });

  // R2 Upload route (single-request; raised to 32 MiB — use multipart for larger)
  ipfs.post('/r2/upload', async (c) => {
    try {
      // Check if R2 bucket is available
      if (!c.env.BOING_STORAGE) {
        return c.json({ 
          success: false,
          error: 'R2 storage not configured. Please set up Cloudflare R2 bucket.' 
        }, 500);
      }

      const r2Service = getR2Service(c);
      
      // Handle multipart form data
      const formData = await c.req.formData();
      const file = formData.get('file');
      
      if (!file) {
        return c.json({ 
          success: false,
          error: 'No file provided' 
        }, 400);
      }

      // Validate file
      try {
        r2Service.validateFile(file, R2_SIMPLE_MAX_BYTES);
      } catch (validationError) {
        return c.json({ 
          success: false,
          error: validationError.message 
        }, 400);
      }

      // Get additional metadata
      const tokenName = formData.get('tokenName') || '';
      const tokenSymbol = formData.get('tokenSymbol') || '';
      const description = formData.get('description') || '';

      const canonicalKey = String(formData.get('canonicalKey') || '');
      const fileBytes = await file.arrayBuffer();
      const fileCopy = new File([fileBytes], file.name || 'upload', { type: file.type || 'application/octet-stream' });

      // Upload file to R2
      const uploadResult = await r2Service.uploadFile(fileCopy, {
        tokenName,
        tokenSymbol,
        description,
        uploadedBy: c.req.header('x-user-address') || 'unknown'
      });

      if (/^metadata\/[a-f0-9]{64}\.json$/.test(canonicalKey)) {
        await r2Service.putCanonicalJson(canonicalKey, new TextDecoder().decode(fileBytes));
      }

      console.log('R2 upload successful:', uploadResult);

      return c.json({
        success: true,
        data: uploadResult
      });

    } catch (error) {
      console.error('R2 upload error:', error);
      return c.json({ 
        success: false,
        error: 'Upload failed', 
        details: error.message 
      }, 500);
    }
  });

  // --- Chunked / multipart upload (Worker → R2 binding) ---

  ipfs.post('/r2/multipart/create', async (c) => {
    try {
      if (!c.env.BOING_STORAGE) {
        return c.json({ success: false, error: 'R2 storage not configured' }, 500);
      }
      const body = await c.req.json().catch(() => ({}));
      const originalName = String(body.fileName || body.name || 'upload.bin').slice(0, 240);
      const contentType = String(body.contentType || 'application/octet-stream');
      const size = Number(body.size) || 0;
      if (size > R2_MULTIPART_OBJECT_MAX_BYTES) {
        return c.json({
          success: false,
          error: `File exceeds per-object max of ${R2_MULTIPART_OBJECT_MAX_BYTES} bytes`,
        }, 400);
      }
      const r2Service = getR2Service(c);
      try {
        r2Service.validateContentType(contentType, { allowBinary: true });
      } catch (e) {
        return c.json({ success: false, error: e.message }, 400);
      }
      const created = await r2Service.createMultipartUpload(originalName, contentType, {
        uploadedBy: c.req.header('x-user-address') || 'unknown',
        declaredSize: String(size || 0),
      });
      return c.json({
        success: true,
        data: {
          ...created,
          collectionBudgetBytes: collectionBudgetBytes(c.env),
        },
      });
    } catch (error) {
      console.error('R2 multipart create error:', error);
      return c.json({ success: false, error: 'Failed to start multipart upload', details: error.message }, 500);
    }
  });

  ipfs.put('/r2/multipart/part', async (c) => {
    try {
      if (!c.env.BOING_STORAGE) {
        return c.json({ success: false, error: 'R2 storage not configured' }, 500);
      }
      const key = c.req.query('key') || c.req.header('x-r2-key') || '';
      const uploadId = c.req.query('uploadId') || c.req.header('x-r2-upload-id') || '';
      const partNumber = c.req.query('partNumber') || c.req.header('x-r2-part-number') || '';
      if (!key || !uploadId || !partNumber) {
        return c.json({ success: false, error: 'key, uploadId, and partNumber are required' }, 400);
      }
      const contentLength = Number(c.req.header('content-length') || 0);
      if (contentLength > R2_PART_MAX_BYTES) {
        return c.json({
          success: false,
          error: `Part exceeds max ${R2_PART_MAX_BYTES} bytes`,
        }, 413);
      }
      const body = await c.req.arrayBuffer();
      if (!body || body.byteLength === 0) {
        return c.json({ success: false, error: 'Empty part body' }, 400);
      }
      if (body.byteLength > R2_PART_MAX_BYTES) {
        return c.json({ success: false, error: `Part exceeds max ${R2_PART_MAX_BYTES} bytes` }, 413);
      }
      const r2Service = getR2Service(c);
      const part = await r2Service.uploadMultipartPart(key, uploadId, partNumber, body);
      return c.json({ success: true, data: part });
    } catch (error) {
      console.error('R2 multipart part error:', error);
      return c.json({ success: false, error: 'Part upload failed', details: error.message }, 500);
    }
  });

  ipfs.post('/r2/multipart/complete', async (c) => {
    try {
      if (!c.env.BOING_STORAGE) {
        return c.json({ success: false, error: 'R2 storage not configured' }, 500);
      }
      const body = await c.req.json();
      const key = String(body.key || '');
      const uploadId = String(body.uploadId || '');
      const parts = body.parts;
      if (!key || !uploadId) {
        return c.json({ success: false, error: 'key and uploadId are required' }, 400);
      }
      const r2Service = getR2Service(c);
      const result = await r2Service.completeMultipartUpload(key, uploadId, parts, {
        originalName: body.fileName || body.originalName,
        contentType: body.contentType,
        size: body.size,
      });
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error('R2 multipart complete error:', error);
      return c.json({ success: false, error: 'Failed to complete multipart upload', details: error.message }, 500);
    }
  });

  ipfs.post('/r2/multipart/abort', async (c) => {
    try {
      if (!c.env.BOING_STORAGE) {
        return c.json({ success: false, error: 'R2 storage not configured' }, 500);
      }
      const body = await c.req.json().catch(() => ({}));
      const key = String(body.key || '');
      const uploadId = String(body.uploadId || '');
      if (!key || !uploadId) {
        return c.json({ success: false, error: 'key and uploadId are required' }, 400);
      }
      const r2Service = getR2Service(c);
      await r2Service.abortMultipartUpload(key, uploadId);
      return c.json({ success: true });
    } catch (error) {
      console.error('R2 multipart abort error:', error);
      return c.json({ success: false, error: 'Failed to abort multipart upload', details: error.message }, 500);
    }
  });

  // R2 Metadata upload route
  ipfs.post('/r2/metadata', async (c) => {
    try {
      if (!c.env.BOING_STORAGE) {
        return c.json({ 
          success: false,
          error: 'R2 storage not configured' 
        }, 500);
      }

      // Get worker URL from environment or request
      const workerUrl = c.env.WORKER_URL || 
        (c.req.url ? new URL(c.req.url).origin : null);
      
      const r2Service = new R2UploadService(c.env.BOING_STORAGE, {
        workerUrl: workerUrl
      });
      const metadata = await c.req.json();

      if (!metadata) {
        return c.json({ 
          success: false,
          error: 'No metadata provided' 
        }, 400);
      }

      // Upload metadata to R2
      const uploadResult = await r2Service.uploadMetadata(metadata);

      console.log('R2 metadata upload successful:', uploadResult);

      return c.json({
        success: true,
        data: uploadResult
      });

    } catch (error) {
      console.error('R2 metadata upload error:', error);
      return c.json({ 
        success: false,
        error: 'Metadata upload failed', 
        details: error.message 
      }, 500);
    }
  });

  // R2 File retrieval route
  ipfs.get('/r2/file/:fileName', async (c) => {
    try {
      if (!c.env.BOING_STORAGE) {
        return c.json({ 
          success: false,
          error: 'R2 storage not configured' 
        }, 500);
      }

      // Get worker URL from environment or request
      const workerUrl = c.env.WORKER_URL || 
        (c.req.url ? new URL(c.req.url).origin : null);
      
      const r2Service = new R2UploadService(c.env.BOING_STORAGE, {
        workerUrl: workerUrl
      });
      const fileName = c.req.param('fileName');

      const file = await r2Service.getFile(fileName);
      
      // Set appropriate headers
      c.header('Content-Type', file.httpMetadata?.contentType || 'application/octet-stream');
      c.header('Cache-Control', file.httpMetadata?.cacheControl || 'public, max-age=31536000');
      
      // Return file data
      return c.body(file.body);

    } catch (error) {
      console.error('R2 file retrieval error:', error);
      return c.json({ 
        success: false,
        error: 'File not found', 
        details: error.message 
      }, 404);
    }
  });

  // R2 File list route
  ipfs.get('/r2/files', async (c) => {
    try {
      const listSecret = c.env.R2_LIST_SECRET || c.env.ADMIN_API_KEY;
      const provided = c.req.header('x-admin-key') || c.req.query('secret') || '';
      if (!listSecret || provided !== listSecret) {
        return c.json({ success: false, error: 'Not found' }, 404);
      }

      if (!c.env.BOING_STORAGE) {
        return c.json({ 
          success: false,
          error: 'R2 storage not configured' 
        }, 500);
      }

      // Get worker URL from environment or request
      const workerUrl = c.env.WORKER_URL || 
        (c.req.url ? new URL(c.req.url).origin : null);
      
      const r2Service = new R2UploadService(c.env.BOING_STORAGE, {
        workerUrl: workerUrl
      });
      const prefix = c.req.query('prefix');
      const limit = parseInt(c.req.query('limit') || '100');
      const cursor = c.req.query('cursor');

      const files = await r2Service.listFiles(prefix, limit, cursor);

      return c.json({
        success: true,
        data: files
      });

    } catch (error) {
      console.error('R2 file list error:', error);
      return c.json({ 
        success: false,
        error: 'Failed to list files', 
        details: error.message 
      }, 500);
    }
  });

  return ipfs;
}; 