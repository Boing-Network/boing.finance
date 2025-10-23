import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from './database/schema.js';
import { createDEXRoutes } from './routes/dexRoutes.js';
import { createAnalyticsRoutes } from './routes/analyticsRoutes.js';
import { createIPFSRoutes } from './routes/ipfsRoutes.js';

// Create main app
const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://boing.finance'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'OK',
    message: 'DEX API is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'production'
  });
});

// Simple database test
app.get('/api/test', async (c) => {
  try {
    // Get D1 database from Cloudflare environment
    const d1 = c.env.DB;
    if (!d1) {
      return c.json({ 
        success: false, 
        error: 'Database not configured' 
      }, 500);
    }
    // Create database connection using D1
    const db = drizzle(d1, { schema });
    // Test simple query
    const result = await db.select({ count: sql`count(*)` }).from(schema.knownTokens);
    return c.json({ 
      success: true, 
      message: 'Database connection successful',
      tokenCount: result[0]?.count || 0
    });
  } catch (error) {
    console.error('Database test error:', error);
    return c.json({ 
      success: false, 
      error: 'Database test failed',
      message: error.message 
    }, 500);
  }
});

// Middleware to inject DB into context
const dbMiddleware = async (c, next) => {
  const d1 = c.env.DB;
  if (!d1) {
    return c.json({ success: false, error: 'Database not configured' }, 500);
  }
  c.set('db', drizzle(d1, { schema }));
  await next();
};

// Mount DEX routes at /api
const dexRoutes = createDEXRoutes();
dexRoutes.use('*', dbMiddleware);
app.route('/api', dexRoutes);

// Mount Analytics routes at /analytics
const analyticsRoutes = createAnalyticsRoutes();
analyticsRoutes.use('*', dbMiddleware);
app.route('/analytics', analyticsRoutes);

// Mount IPFS routes (including R2 upload) at /api
const ipfsRoutes = createIPFSRoutes();
app.route('/api', ipfsRoutes);

// Webhook routes
app.post('/api/webhook', async (c) => {
  try {
    console.log('🔔 Farcaster webhook received:', {
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(c.req.raw.headers.entries()),
      body: await c.req.json()
    });

    // Handle different types of Farcaster events
    const body = await c.req.json();
    const { type, data } = body;

    switch (type) {
      case 'user_interaction':
        console.log('👤 User interaction:', data);
        break;
      
      case 'user_follow':
        console.log('➕ User followed:', data);
        break;
      
      case 'user_unfollow':
        console.log('➖ User unfollowed:', data);
        break;
      
      case 'app_install':
        console.log('📱 App installed:', data);
        break;
      
      case 'app_uninstall':
        console.log('🗑️ App uninstalled:', data);
        break;
      
      case 'analytics':
        console.log('📊 Analytics data:', data);
        break;
      
      default:
        console.log('❓ Unknown webhook type:', type, data);
    }

    return c.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    return c.json({
      success: false,
      message: 'Webhook processed with errors',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook health check
app.get('/api/webhook/health', (c) => {
  return c.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString(),
    service: 'boing.finance'
  });
});

// Error handling
app.onError((err, c) => {
  console.error('Worker Error:', err);
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

export default app; 