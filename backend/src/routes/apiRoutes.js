// Public API Routes
// Provides public API access to token analytics and data

import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from '../database/schema.js';
import coingeckoService from '../../frontend/src/services/coingeckoService.js';

export const createAPIRoutes = () => {
  const api = new Hono();

  // API Documentation endpoint
  api.get('/docs', (c) => {
    return c.json({
      name: 'Boing Finance API',
      version: '1.0.0',
      description: 'Public API for accessing token analytics and data',
      baseUrl: c.req.url.split('/api')[0] + '/api',
      endpoints: {
        '/tokens': {
          method: 'GET',
          description: 'Get list of tokens',
          parameters: {
            network: 'Filter by network (optional)',
            limit: 'Limit results (default: 100, max: 1000)',
            offset: 'Pagination offset (default: 0)'
          },
          example: '/api/tokens?network=ethereum&limit=50'
        },
        '/tokens/:address': {
          method: 'GET',
          description: 'Get token details by address',
          parameters: {
            address: 'Token contract address',
            network: 'Network name (optional)'
          },
          example: '/api/tokens/0x123...?network=ethereum'
        },
        '/tokens/:address/analytics': {
          method: 'GET',
          description: 'Get analytics data for a token',
          parameters: {
            address: 'Token contract address',
            network: 'Network name (optional)',
            timeframe: 'Timeframe: 24h, 7d, 30d, all (default: 7d)'
          },
          example: '/api/tokens/0x123.../analytics?timeframe=7d'
        },
        '/tokens/:address/price': {
          method: 'GET',
          description: 'Get current price for a token',
          parameters: {
            address: 'Token contract address',
            network: 'Network name (optional)'
          },
          example: '/api/tokens/0x123.../price?network=ethereum'
        },
        '/webhooks': {
          method: 'POST',
          description: 'Register a webhook for token events',
          body: {
            url: 'Webhook URL',
            events: ['price_change', 'volume_spike', 'new_holder'],
            tokenAddress: 'Token address (optional, for specific token)',
            network: 'Network name (optional)'
          }
        },
        '/webhooks/:id': {
          method: 'DELETE',
          description: 'Delete a webhook'
        },
        '/rate-limits': {
          method: 'GET',
          description: 'Get current rate limit status'
        }
      },
      rateLimits: {
        free: {
          requestsPerMinute: 60,
          requestsPerDay: 10000
        },
        authenticated: {
          requestsPerMinute: 300,
          requestsPerDay: 100000
        }
      },
      authentication: {
        type: 'API Key',
        header: 'X-API-Key',
        description: 'Optional API key for higher rate limits'
      }
    });
  });

  // Get tokens list
  api.get('/tokens', async (c) => {
    try {
      const network = c.req.query('network');
      const limit = Math.min(parseInt(c.req.query('limit') || '100'), 1000);
      const offset = parseInt(c.req.query('offset') || '0');

      // In a real implementation, this would query the database
      // For now, return a sample response
      return c.json({
        success: true,
        data: [],
        pagination: {
          limit,
          offset,
          total: 0
        },
        message: 'Token list endpoint - database integration pending'
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get token details
  api.get('/tokens/:address', async (c) => {
    try {
      const address = c.req.param('address');
      const network = c.req.query('network') || 'ethereum';

      // In a real implementation, this would query the database
      return c.json({
        success: true,
        data: {
          address,
          network,
          message: 'Token details endpoint - database integration pending'
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get token analytics
  api.get('/tokens/:address/analytics', async (c) => {
    try {
      const address = c.req.param('address');
      const network = c.req.query('network') || 'ethereum';
      const timeframe = c.req.query('timeframe') || '7d';

      // Fetch price data from CoinGecko
      let priceData = null;
      try {
        priceData = await coingeckoService.getTokenPrice(address, network);
      } catch (error) {
        console.error('Error fetching price data:', error);
      }

      return c.json({
        success: true,
        data: {
          address,
          network,
          timeframe,
          price: priceData?.usd || null,
          priceChange24h: priceData?.usd_24h_change || null,
          analytics: {
            message: 'Full analytics endpoint - additional data sources pending'
          }
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get token price
  api.get('/tokens/:address/price', async (c) => {
    try {
      const address = c.req.param('address');
      const network = c.req.query('network') || 'ethereum';

      // Fetch price from CoinGecko
      let priceData = null;
      try {
        const apiKey = c.env.COINGECKO_API_KEY || '';
        const url = `https://api.coingecko.com/api/v3/simple/token_price/${network}?contract_addresses=${address}&vs_currencies=usd&include_24hr_change=true${apiKey ? `&x_cg_demo_api_key=${apiKey}` : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          priceData = data[address.toLowerCase()];
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
      }

      return c.json({
        success: true,
        data: {
          address,
          network,
          price: priceData?.usd || null,
          priceChange24h: priceData?.usd_24h_change || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Webhook registration (stored in KV for now)
  api.post('/webhooks', async (c) => {
    try {
      const body = await c.req.json();
      const { url, events, tokenAddress, network } = body;

      if (!url || !events || !Array.isArray(events)) {
        return c.json({ success: false, error: 'Invalid webhook data' }, 400);
      }

      const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store webhook in KV (if available)
      if (c.env.CACHE) {
        await c.env.CACHE.put(
          `webhook:${webhookId}`,
          JSON.stringify({ url, events, tokenAddress, network, createdAt: new Date().toISOString() })
        );
      }

      return c.json({
        success: true,
        data: {
          id: webhookId,
          url,
          events,
          tokenAddress,
          network,
          message: 'Webhook registered successfully'
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Delete webhook
  api.delete('/webhooks/:id', async (c) => {
    try {
      const id = c.req.param('id');

      if (c.env.CACHE) {
        await c.env.CACHE.delete(`webhook:${id}`);
      }

      return c.json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Rate limits info
  api.get('/rate-limits', (c) => {
    return c.json({
      success: true,
      data: {
        free: {
          requestsPerMinute: 60,
          requestsPerDay: 10000,
          description: 'Free tier limits'
        },
        authenticated: {
          requestsPerMinute: 300,
          requestsPerDay: 100000,
          description: 'Authenticated tier limits (requires API key)'
        },
        current: {
          // In a real implementation, track actual usage
          requestsToday: 0,
          requestsThisMinute: 0
        }
      }
    });
  });

  return api;
};

