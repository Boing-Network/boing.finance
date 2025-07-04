import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDB } from './database/connection.js';
import { createDEXRoutes } from './routes/dexRoutes.js';
import { createIPFSRoutes } from './routes/ipfsRoutes.js';

// Create main app
const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Debug middleware to log all requests
app.use('*', async (c, next) => {
  console.log(`[SERVER] ${c.req.method} ${c.req.url}`);
  await next();
});

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'OK',
    message: 'DEX API is running on Node.js',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Immediately-invoked async function to set up DB and routes before starting server
(async () => {
  const { db } = await createDB();
  const dexRoutes = createDEXRoutes(db);
  const ipfsRoutes = createIPFSRoutes();
  
  console.log('[SERVER] Registering routes...');
  app.route('/api', dexRoutes);
  app.route('/ipfs', ipfsRoutes);
  console.log('[SERVER] Routes registered successfully');

  // Error handling
  app.onError((err, c) => {
    console.error('Server Error:', err);
    return c.json({ 
      success: false, 
      error: 'Internal server error',
      message: err.message 
    }, 500);
  });

  // 404 handler
  app.notFound((c) => {
    return c.json({ 
      success: false, 
      error: 'Route not found' 
    }, 404);
  });

  // Start server
  const port = process.env.PORT || 3001;
  console.log(`🚀 DEX API server starting on port ${port}...`);

  serve({
    fetch: app.fetch,
    port
  });

  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/`);
  console.log(`🔗 API base: http://localhost:${port}/api`);
})(); 