import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from './database/schema.js';
import { createDEXRoutes } from './routes/dexRoutes.js';

// Create main app
const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
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
    const result = await db.select({ count: sql`count(*)` }).from(schema.tokens);
    
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

// API routes
app.route('/api', async (c) => {
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
    
    // Create and return DEX routes
    const dexRoutes = createDEXRoutes(db);
    return dexRoutes.fetch(c.req.raw, c.env, c.executionCtx);
  } catch (error) {
    console.error('Database connection error:', error);
    return c.json({ 
      success: false, 
      error: 'Database connection failed',
      message: error.message 
    }, 500);
  }
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