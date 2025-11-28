import { Hono } from 'hono';
import { R2UploadService } from '../services/r2UploadService.js';

// Create IPFS routes
export const createIPFSRoutes = () => {
  const ipfs = new Hono();

  // Debug middleware to log all requests
  ipfs.use('*', async (c, next) => {
    console.log(`[IPFS] ${c.req.method} ${c.req.url}`);
    await next();
  });

  // R2 Upload route
  ipfs.post('/r2/upload', async (c) => {
    try {
      // Check if R2 bucket is available
      if (!c.env.BOING_STORAGE) {
        return c.json({ 
          success: false,
          error: 'R2 storage not configured. Please set up Cloudflare R2 bucket.' 
        }, 500);
      }

      // Get worker URL from environment or request
      const workerUrl = c.env.WORKER_URL || 
        (c.req.url ? new URL(c.req.url).origin : null);
      
      const r2Service = new R2UploadService(c.env.BOING_STORAGE, {
        workerUrl: workerUrl
      });
      
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
        r2Service.validateFile(file);
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

      // Upload file to R2
      const uploadResult = await r2Service.uploadFile(file, {
        tokenName,
        tokenSymbol,
        description,
        uploadedBy: c.req.header('x-user-address') || 'unknown'
      });

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