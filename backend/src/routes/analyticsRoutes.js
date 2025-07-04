import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AnalyticsRepository } from '../database/repositories/analyticsRepository.js';

export function createAnalyticsRoutes() {
  const app = new Hono();

  // Middleware
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
      message: 'Analytics API is running',
      timestamp: new Date().toISOString()
    });
  });

  // User Interactions
  app.post('/interactions', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const interactionData = await c.req.json();
      
      if (!interactionData.userId || !interactionData.action) {
        return c.json({ success: false, error: 'Missing required fields' }, 400);
      }
      
      const interaction = await analyticsRepo.trackUserInteraction(interactionData);
      return c.json({ success: true, data: interaction });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/interactions/:userId', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const userId = c.req.param('userId');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 50;
      
      const interactions = await analyticsRepo.getUserInteractions(userId, chainId, limit);
      return c.json({ success: true, data: interactions });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/interactions/:userId/stats', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const userId = c.req.param('userId');
      const timeRange = c.req.query('timeRange') || '24h';
      
      const stats = await analyticsRepo.getInteractionStats(userId, timeRange);
      return c.json({ success: true, data: stats });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Search Analytics
  app.post('/search', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const { query, chainId, resultCount } = await c.req.json();
      
      if (!query) {
        return c.json({ success: false, error: 'Search query is required' }, 400);
      }
      
      const search = await analyticsRepo.trackSearchQuery(query, chainId, resultCount);
      return c.json({ success: true, data: search });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.post('/search/click', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const { query } = await c.req.json();
      
      if (!query) {
        return c.json({ success: false, error: 'Search query is required' }, 400);
      }
      
      await analyticsRepo.incrementSearchClick(query);
      return c.json({ success: true, message: 'Click tracked' });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/search/popular', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 10;
      
      const searches = await analyticsRepo.getPopularSearches(chainId, limit);
      return c.json({ success: true, data: searches });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // User Preferences
  app.get('/preferences/:userId', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const userId = c.req.param('userId');
      
      const preferences = await analyticsRepo.getUserPreferences(userId);
      return c.json({ success: true, data: preferences });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.put('/preferences/:userId', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const userId = c.req.param('userId');
      const preferences = await c.req.json();
      
      const updatedPrefs = await analyticsRepo.updateUserPreferences(userId, preferences);
      return c.json({ success: true, data: updatedPrefs });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Analytics Events
  app.post('/events', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const eventData = await c.req.json();
      
      if (!eventData.eventType || !eventData.eventName) {
        return c.json({ success: false, error: 'Missing required fields' }, 400);
      }
      
      const event = await analyticsRepo.trackEvent(eventData);
      return c.json({ success: true, data: event });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/events/:eventType/stats', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const eventType = c.req.param('eventType');
      const timeRange = c.req.query('timeRange') || '24h';
      
      const stats = await analyticsRepo.getEventStats(eventType, timeRange);
      return c.json({ success: true, data: stats });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Cache Management
  app.get('/cache/:key', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const key = c.req.param('key');
      
      const data = await analyticsRepo.getCachedData(key);
      if (!data) {
        return c.json({ success: false, error: 'Cache miss' }, 404);
      }
      
      return c.json({ success: true, data });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.post('/cache', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const { key, value, expiresInMinutes } = await c.req.json();
      
      if (!key || value === undefined) {
        return c.json({ success: false, error: 'Key and value are required' }, 400);
      }
      
      await analyticsRepo.setCachedData(key, value, expiresInMinutes);
      return c.json({ success: true, message: 'Data cached' });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.delete('/cache/expired', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      await analyticsRepo.clearExpiredCache();
      return c.json({ success: true, message: 'Expired cache cleared' });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Error Logging
  app.post('/errors', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const errorData = await c.req.json();
      
      if (!errorData.errorType || !errorData.errorMessage) {
        return c.json({ success: false, error: 'Missing required fields' }, 400);
      }
      
      const error = await analyticsRepo.logError(errorData);
      return c.json({ success: true, data: error });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/errors/stats', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const timeRange = c.req.query('timeRange') || '24h';
      
      const stats = await analyticsRepo.getErrorStats(timeRange);
      return c.json({ success: true, data: stats });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Known Tokens
  app.post('/tokens', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const tokenData = await c.req.json();
      
      if (!tokenData.address || !tokenData.name || !tokenData.symbol) {
        return c.json({ success: false, error: 'Missing required token fields' }, 400);
      }
      
      const token = await analyticsRepo.addKnownToken(tokenData);
      return c.json({ success: true, data: token });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/tokens', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 100;
      
      const tokens = await analyticsRepo.getKnownTokens(chainId, limit);
      return c.json({ success: true, data: tokens });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/tokens/search', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const query = c.req.query('q');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 20;
      
      if (!query) {
        return c.json({ success: false, error: 'Search query is required' }, 400);
      }
      
      const tokens = await analyticsRepo.searchKnownTokens(query, chainId, limit);
      return c.json({ success: true, data: tokens });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Dashboard Stats
  app.get('/dashboard', async (c) => {
    try {
      const db = c.get('db');
      const analyticsRepo = new AnalyticsRepository(db);
      const timeRange = c.req.query('timeRange') || '24h';
      
      const stats = await analyticsRepo.getDashboardStats(timeRange);
      return c.json({ success: true, data: stats });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  return app;
} 