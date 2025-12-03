import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from './database/schema.js';
import { createDEXRoutes } from './routes/dexRoutes.js';
import { createAnalyticsRoutes } from './routes/analyticsRoutes.js';
import { createIPFSRoutes } from './routes/ipfsRoutes.js';
import { createAPIRoutes } from './routes/apiRoutes.js';
import collectAnalytics from './scheduled/collectAnalytics.js';

// Create main app
const app = new Hono();

// Global middleware - CORS configuration based on environment
app.use('*', async (c, next) => {
  const env = c.env.NODE_ENV || 'production';
  const frontendUrl = c.env.FRONTEND_URL || 'https://boing.finance';
  
  // Determine allowed origins based on environment
  const allowedOrigins = env === 'production' 
    ? [frontendUrl, 'https://boing.finance']
    : env === 'staging'
    ? [frontendUrl, 'https://staging.boing.finance', 'http://localhost:3000']
    : ['http://localhost:3000', frontendUrl];
  
  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Address'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
  })(c, next);
});

// Performance optimization middleware - add response headers
app.use('*', async (c, next) => {
  const startTime = Date.now();
  await next();
  const responseTime = Date.now() - startTime;
  
  // Add security and performance headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache headers for GET requests (if not already set)
  if (c.req.method === 'GET' && !c.res.headers.get('Cache-Control')) {
    // Default cache for API responses (5 minutes)
    c.header('Cache-Control', 'public, max-age=300, must-revalidate');
  }
  
  // Add timing header for performance monitoring
  c.header('X-Response-Time', `${responseTime}ms`);
});

// Health check with enhanced information
app.get('/', (c) => {
  const env = c.env.NODE_ENV || 'production';
  // No cache for health check endpoint
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  return c.json({
    status: 'OK',
    message: 'DEX API is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    environment: env,
    version: '1.0.0',
    services: {
      database: c.env.DB ? 'configured' : 'not configured',
      storage: c.env.BOING_STORAGE ? 'configured' : 'not configured'
    }
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

// Caching middleware for GET requests
const cacheMiddleware = async (c, next) => {
  await next();
  
  // Only cache successful GET requests
  if (c.req.method === 'GET' && c.res.status === 200) {
    const path = c.req.path;
    
    // Different cache TTLs for different endpoints
    let cacheTTL = 300; // Default 5 minutes
    
    if (path.includes('/tokens')) {
      cacheTTL = 600; // 10 minutes for token lists
    } else if (path.includes('/pools') || path.includes('/liquidity')) {
      cacheTTL = 180; // 3 minutes for pool data (changes frequently)
    } else if (path.includes('/analytics')) {
      cacheTTL = 300; // 5 minutes for analytics
    } else if (path.includes('/test')) {
      cacheTTL = 0; // No cache for test endpoint
    }
    
    if (cacheTTL > 0) {
      c.header('Cache-Control', `public, max-age=${cacheTTL}, must-revalidate`);
      c.header('CDN-Cache-Control', `public, max-age=${cacheTTL}`);
    }
  }
};

// Mount DEX routes at /api
const dexRoutes = createDEXRoutes();
dexRoutes.use('*', dbMiddleware);
dexRoutes.use('*', cacheMiddleware);
app.route('/api', dexRoutes);

// Mount Analytics routes at /analytics
const analyticsRoutes = createAnalyticsRoutes();
analyticsRoutes.use('*', dbMiddleware);
analyticsRoutes.use('*', cacheMiddleware);
app.route('/analytics', analyticsRoutes);

// Mount IPFS routes (including R2 upload) at /api
const ipfsRoutes = createIPFSRoutes();
app.route('/api', ipfsRoutes);

// Mount Public API routes at /api
const apiRoutes = createAPIRoutes();
apiRoutes.use('*', dbMiddleware);
apiRoutes.use('*', cacheMiddleware);
app.route('/api', apiRoutes);

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

// Error handling with better logging
app.onError((err, c) => {
  const env = c.env.NODE_ENV || 'production';
  const errorId = Math.random().toString(36).substring(2, 15);
  
  console.error('Worker Error:', {
    errorId,
    message: err.message,
    stack: env !== 'production' ? err.stack : undefined,
    url: c.req.url,
    method: c.req.method,
    environment: env,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  const errorMessage = env === 'production' 
    ? 'Internal server error'
    : err.message;
  
  return c.json({ 
    success: false, 
    error: 'Internal server error',
    message: errorMessage,
    errorId: env !== 'production' ? errorId : undefined
  }, 500);
});

// 404 handler with helpful information
app.notFound((c) => {
  return c.json({ 
    success: false, 
    error: 'Route not found',
    path: c.req.path,
    method: c.req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/test',
      'POST /api/webhook',
      'GET /api/webhook/health'
    ]
  }, 404);
});

// Export the main app for HTTP requests
export default app;

// Export scheduled handlers for Cron Triggers
export { collectAnalytics }; 