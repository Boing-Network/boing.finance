import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from './database/schema.js';
import { createDEXRoutes } from './routes/dexRoutes.js';
import { createAnalyticsRoutes } from './routes/analyticsRoutes.js';
import { createIPFSRoutes } from './routes/ipfsRoutes.js';
import { createAPIRoutes } from './routes/apiRoutes.js';
import { createWalletActivityRoutes } from './routes/walletActivityRoutes.js';
import { createPortfolioRoutes } from './routes/portfolioRoutes.js';
import { createAIRoutes } from './routes/aiRoutes.js';
import { createGovernanceRoutes } from './routes/governanceRoutes.js';
import { createBoingRoutes } from './routes/boingRoutes.js';
import { createSolanaRoutes } from './routes/solanaRoutes.js';
import { handleSolanaRpcPost } from './routes/solanaRpcRoute.js';
import { createAggregatorRoutes } from './routes/aggregatorRoutes.js';
import { createRealtimeRoutes } from './routes/realtimeRoutes.js';
import collectAnalytics from './scheduled/collectAnalytics.js';

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
];

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Create main app
const app = new Hono();

// Global middleware - CORS configuration based on environment
app.use('*', async (c, next) => {
  const env = c.env.NODE_ENV || 'production';
  const frontendUrl = c.env.FRONTEND_URL || 'https://boing.finance';
  
  const allowedOrigins = env === 'production' 
    ? [frontendUrl, 'https://boing.finance']
    : env === 'staging'
    ? [frontendUrl, 'https://staging.boing.finance', ...LOCAL_ORIGINS]
    : [...LOCAL_ORIGINS, frontendUrl];
  
  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-User-Address',
      'X-Alchemy-Signature',
      'solana-client',
    ],
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

// Inject the Drizzle DB handle into the request context for every route.
//
// IMPORTANT (Hono ordering): middleware only wraps handlers that are registered AFTER
// it. Registering `routes.use('*', dbMiddleware)` on a sub-app *after* its handlers were
// defined (as this file used to do) means the middleware never runs before the handlers,
// so `c.get('db')` was undefined and every DB route returned 500. Always register
// `app.use(...)` BEFORE the `app.route(...)` call for the routes it should protect.
export const injectDb = async (c, next) => {
  if (c.env && c.env.DB) {
    c.set('db', drizzle(c.env.DB, { schema }));
  }
  await next();
};

// Strict variant for DB-only route groups: fail fast with a clear message.
export const dbMiddleware = async (c, next) => {
  if (!c.get('db')) {
    const d1 = c.env && c.env.DB;
    if (!d1) {
      return c.json({ success: false, error: 'Database not configured' }, 500);
    }
    c.set('db', drizzle(d1, { schema }));
  }
  await next();
};

// Caching middleware for GET requests
export const cacheMiddleware = async (c, next) => {
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

// Every route below can read `c.get('db')`: the injector runs before any route is mounted.
app.use('*', injectDb);

// Middleware is registered with app.use() BEFORE the matching app.route() so it really
// wraps the handlers. Prefixes are scoped to DB-backed groups; routes that share the
// /api prefix but need no DB (AI, aggregator, webhooks, R2, Solana RPC proxy) are untouched.
// /api/tokens* and /api/liquidity* are the cacheable DEX/API groups mounted at /api.
app.use('/api/tokens', cacheMiddleware);
app.use('/api/tokens/*', cacheMiddleware);
app.use('/api/liquidity/*', cacheMiddleware);
app.use('/api/analytics', dbMiddleware, cacheMiddleware);
app.use('/api/analytics/*', dbMiddleware, cacheMiddleware);
app.use('/analytics', dbMiddleware, cacheMiddleware);
app.use('/analytics/*', dbMiddleware, cacheMiddleware);
app.use('/api/portfolio', dbMiddleware);
app.use('/api/portfolio/*', dbMiddleware);
app.use('/api/governance', dbMiddleware, cacheMiddleware);
app.use('/api/governance/*', dbMiddleware, cacheMiddleware);
app.use('/api/boing', dbMiddleware, cacheMiddleware);
app.use('/api/boing/*', dbMiddleware, cacheMiddleware);
app.use('/api/solana/deployments', dbMiddleware);
app.use('/api/solana/deployments/*', dbMiddleware);

// Mount Portfolio routes (D1 snapshots for PnL) BEFORE the DEX routes: the DEX group
// declares GET /portfolio/:address, which would otherwise shadow GET /api/portfolio/snapshots
// (Hono runs the first matching handler in registration order).
app.route('/api/portfolio', createPortfolioRoutes());

// Mount DEX routes at /api
app.route('/api', createDEXRoutes());

// Mount Analytics routes at /analytics
app.route('/analytics', createAnalyticsRoutes());

// Mount IPFS routes (including R2 upload) at /api
app.route('/api', createIPFSRoutes());

// Mount Public API routes at /api
app.route('/api', createAPIRoutes());

// Mount Wallet Activity routes at /api/analytics
app.route('/api/analytics', createWalletActivityRoutes());

// Mount AI Assistant routes at /api/ai (no DB required)
app.route('/api/ai', createAIRoutes());

// Mount Governance routes at /api/governance
app.route('/api/governance', createGovernanceRoutes());

// Mount BOING routes (points, activity) at /api/boing
app.route('/api/boing', createBoingRoutes());

app.post('/api/solana/rpc', handleSolanaRpcPost);

// Mount Solana routes (deployments) at /api/solana
app.route('/api/solana', createSolanaRoutes());

// Aggregator quotes (LI.FI / Jupiter) — no DB; do not cache
const aggregatorRoutes = createAggregatorRoutes();
app.route('/api/aggregator', aggregatorRoutes);

// Alchemy / Helius webhooks + recent deploy events
const realtimeRoutes = createRealtimeRoutes();
app.route('/api', realtimeRoutes);

// Webhook routes
app.post('/api/webhook', async (c) => {
  try {
    const envName = c.env.NODE_ENV || 'production';
    const secret = c.env.FARCASTER_WEBHOOK_SECRET;
    if (!secret) {
      if (envName === 'production') {
        return c.json({ success: false, error: 'Webhook not configured' }, 503);
      }
    } else {
      const provided = c.req.header('authorization') || c.req.header('x-webhook-secret') || '';
      const expected = provided.startsWith('Bearer ') ? provided.slice(7) : provided;
      if (!timingSafeEqual(String(secret), String(expected))) {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }
    }

    const body = await c.req.json().catch(() => ({}));
    const type = body?.type || null;

    return c.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      type
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    return c.json({
      success: false,
      message: 'Webhook processed with errors',
      timestamp: new Date().toISOString()
    }, 400);
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

// Error handling with better logging.
// The real error is always logged server-side (visible in Workers Logs / `wrangler tail`);
// the response body stays generic in production so internals never leak to clients.
app.onError((err, c) => {
  const env = c.env.NODE_ENV || 'production';
  const errorId = Math.random().toString(36).substring(2, 15);
  const message = err && err.message ? String(err.message) : String(err);
  const url = new URL(c.req.url);

  console.error(
    `[worker-error] ${c.req.method} ${url.pathname} id=${errorId} ${err && err.name ? err.name : 'Error'}: ${message}`,
    {
      errorId,
      route: url.pathname,
      method: c.req.method,
      name: err && err.name,
      message,
      cause: err && err.cause && err.cause.message ? String(err.cause.message) : undefined,
      stack: err && err.stack ? String(err.stack).split('\n').slice(0, 8).join('\n') : undefined,
      environment: env,
      timestamp: new Date().toISOString()
    }
  );

  // Don't expose internal errors in production
  const errorMessage = env === 'production'
    ? 'Internal server error'
    : message;

  return c.json({
    success: false,
    error: 'Internal server error',
    message: errorMessage,
    errorId
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