# Analytics Backend Setup Guide

## Overview

This guide explains how to set up the analytics backend API to provide real historical data and fix CORS issues.

## Understanding CORS Issues

### Why CORS Errors Occur

CORS (Cross-Origin Resource Sharing) errors happen when:
- Your frontend (boing.finance) tries to make requests to external APIs (The Graph, CoinGecko)
- Those APIs don't allow requests from your domain
- The browser blocks the request for security reasons

**You cannot fix CORS from the frontend** - it must be fixed by:
1. The API server adding CORS headers (not possible for third-party APIs)
2. Using a backend proxy (✅ **This is what we're doing**)

### How Backend Proxy Fixes CORS

```
Frontend (Browser) → Backend API (Cloudflare Workers) → External APIs
     ✅ No CORS          ✅ No CORS (server-to-server)
```

The backend acts as a proxy:
- Frontend makes requests to YOUR backend (same origin = no CORS)
- Backend makes requests to external APIs (server-to-server = no CORS)
- Backend returns aggregated data to frontend

## Backend Analytics Endpoint

### Endpoint: `/api/analytics`

**URL:** `https://boing-api-prod.nico-chikuji.workers.dev/api/analytics`

**Method:** GET

**Query Parameters:**
- `range` (required): Time range - `24h`, `7d`, `30d`, or `1y`
- `networks` (optional): Comma-separated chain IDs (default: `1` for Ethereum)
  - Example: `networks=1,137,56` for Ethereum, Polygon, and BSC

**Example Requests:**
```bash
# 24 hour analytics for Ethereum
GET /api/analytics?range=24h

# 7 day analytics for multiple networks
GET /api/analytics?range=7d&networks=1,137,56

# 30 day analytics
GET /api/analytics?range=30d

# 1 year analytics
GET /api/analytics?range=1y
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "totalVolume": "1234567890.12",
    "totalLiquidity": "9876543210.98",
    "totalPools": 1234,
    "totalTransactions": 56789,
    "networkStats": {
      "Ethereum": {
        "volume": "1000000000.00",
        "liquidity": "8000000000.00",
        "pools": 1000,
        "users": 0,
        "transactions": 50000
      }
    },
    "topPairs": [
      {
        "token0Symbol": "ETH",
        "token1Symbol": "USDC",
        "network": "Ethereum",
        "volume": "50000000.00",
        "liquidity": "200000000.00",
        "apy": null
      }
    ],
    "marketData": {
      "total_market_cap": { "usd": 2000000000000 },
      "total_volume": { "usd": 50000000000 }
    },
    "timestamp": "2025-12-03T01:00:00.000Z",
    "range": "24h"
  }
}
```

## Environment Variables Setup

Add these to your Cloudflare Workers environment variables:

### Required Variables

1. **CoinGecko API Key** (Optional but recommended)
   - Variable: `COINGECKO_API_KEY`
   - Get from: https://www.coingecko.com/en/api
   - Free tier: 50 calls/minute
   - Without key: Limited to 50 calls/minute

2. **The Graph API Key** (Optional)
   - Variable: `THE_GRAPH_API_KEY`
   - Get from: https://thegraph.com/studio/
   - Free tier available
   - Without key: May have rate limits

### Setting Environment Variables

**Via Wrangler CLI:**
```bash
cd backend
wrangler secret put COINGECKO_API_KEY
wrangler secret put THE_GRAPH_API_KEY
```

**Via Cloudflare Dashboard:**
1. Go to Workers & Pages → Your Worker → Settings → Variables
2. Add environment variables:
   - `COINGECKO_API_KEY`: Your CoinGecko API key
   - `THE_GRAPH_API_KEY`: Your The Graph API key (optional)

## Database Migration

The analytics endpoint uses a new table `analytics_snapshots` for storing historical data.

### Generate Migration

```bash
cd backend
npm run db:generate
```

### Apply Migration to D1

```bash
# For production
wrangler d1 execute boing-database-prod --file=./drizzle/XXXX_analytics_snapshots.sql

# For staging
wrangler d1 execute boing-database-staging --file=./drizzle/XXXX_analytics_snapshots.sql
```

## Historical Data Collection

### Current Implementation

The endpoint currently fetches **real-time data** from:
- CoinGecko (global market data)
- The Graph (DEX statistics)

### Future: Storing Historical Snapshots

To enable true historical data, you need to:

1. **Create a scheduled task** (Cron Trigger) to collect data periodically
2. **Store snapshots** in the `analytics_snapshots` table
3. **Query historical data** based on time range

### Setting Up Cron Triggers

Add to `wrangler.toml`:

```toml
[triggers]
crons = ["0 * * * *"]  # Every hour

# Or more frequent:
# crons = ["*/15 * * * *"]  # Every 15 minutes
```

### Scheduled Data Collection Script

Create `backend/src/scheduled/collectAnalytics.js`:

```javascript
export default {
  async scheduled(event, env, ctx) {
    const analyticsService = new AnalyticsService(env);
    const networks = [1, 137, 56, 42161, 10, 8453]; // All supported networks
    
    // Collect data for all time ranges
    for (const range of ['24h', '7d', '30d', '1y']) {
      try {
        const data = await analyticsService.getAnalyticsData(range, networks);
        
        // Store in database
        const db = drizzle(env.DB, { schema });
        for (const network of networks) {
          await db.insert(schema.analyticsSnapshots).values({
            range,
            network,
            totalVolume: data.totalVolume,
            totalLiquidity: data.totalLiquidity,
            totalPools: data.totalPools,
            totalTransactions: data.totalTransactions,
            snapshotData: JSON.stringify(data.networkStats[network] || {})
          });
        }
      } catch (error) {
        console.error(`Error collecting ${range} data:`, error);
      }
    }
  }
};
```

## Testing the Endpoint

### Local Testing

```bash
cd backend
npm run dev
```

Then test:
```bash
curl http://localhost:8787/api/analytics?range=24h
```

### Production Testing

```bash
curl https://boing-api-prod.nico-chikuji.workers.dev/api/analytics?range=24h
```

## Frontend Integration

The frontend is already configured to use this endpoint. Update `dex/frontend/src/config.js`:

```javascript
export default {
  apiUrl: process.env.REACT_APP_API_URL || 'https://boing-api-prod.nico-chikuji.workers.dev',
  // ... other config
};
```

## Troubleshooting

### 404 Errors

- **Issue:** Endpoint returns 404
- **Solution:** 
  1. Check that the route is mounted in `worker.js`
  2. Verify the endpoint path: `/api/analytics` (not `/analytics`)
  3. Deploy the backend: `cd backend && npm run deploy:prod`

### CORS Still Occurring

- **Issue:** Frontend still sees CORS errors
- **Solution:**
  1. Verify backend CORS middleware is configured
  2. Check that frontend URL is in allowed origins
  3. Ensure requests go to backend, not directly to external APIs

### Rate Limiting

- **Issue:** Too many requests to CoinGecko/The Graph
- **Solution:**
  1. Add API keys for higher rate limits
  2. Implement caching (already done with 5-minute cache)
  3. Use scheduled tasks to pre-fetch data

### Missing Historical Data

- **Issue:** Data doesn't change with time ranges
- **Solution:**
  1. Implement scheduled data collection (see above)
  2. Query `analytics_snapshots` table for historical data
  3. Modify endpoint to return stored snapshots instead of real-time data

## Next Steps

1. ✅ Backend endpoint created (`/api/analytics`)
2. ✅ CORS issues fixed (backend proxy)
3. ⏳ Set up environment variables (API keys)
4. ⏳ Deploy backend changes
5. ⏳ Set up scheduled data collection (for true historical data)
6. ⏳ Update frontend to use real historical data from database

## Support

For issues or questions:
- Check backend logs: `wrangler tail`
- Check frontend console for errors
- Verify API keys are set correctly
- Test endpoint directly with curl

