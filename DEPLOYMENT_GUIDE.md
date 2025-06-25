# 🚀 mochi Deployment Guide - Cloudflare Workers + Hono

This guide covers deploying the mochi backend to Cloudflare Workers using the Hono framework, which is optimized for serverless environments.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development Setup](#local-development-setup)
3. [Cloudflare Workers Setup](#cloudflare-workers-setup)
4. [Database Migration](#database-migration)
5. [Deployment](#deployment)
6. [API Endpoints](#api-endpoints)
7. [Environment Variables](#environment-variables)
8. [Testing](#testing)
9. [Monitoring](#monitoring)

## 🏗️ Architecture Overview

### **New Architecture: Hono + Cloudflare Workers**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Cloudflare      │    │   Cloudflare    │
│   (React)       │◄──►│   Workers        │◄──►│   D1 Database   │
│                 │    │   (Hono API)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Key Benefits:**
- ✅ **Serverless**: No server management required
- ✅ **Global CDN**: 200+ edge locations worldwide
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Cost-effective**: Pay only for actual usage
- ✅ **Hono Framework**: Express-like API optimized for Workers
- ✅ **D1 Database**: Serverless SQLite database

### **Technology Stack:**
- **Backend**: Hono framework (Cloudflare Workers optimized)
- **Database**: Cloudflare D1 (serverless SQLite)
- **ORM**: Drizzle ORM with D1 adapter
- **Frontend**: React with Tailwind CSS
- **Smart Contracts**: Solidity on Ethereum/Sepolia

## 🛠️ Local Development Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Local Database

```bash
# Create data directory
mkdir -p data

# Setup database schema
npm run setup

# Seed with sample data
npm run seed:all
```

### 3. Start Local Development Server

```bash
# Start Wrangler dev server
npm run dev
```

The API will be available at `http://localhost:8787`

## ☁️ Cloudflare Workers Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
# Create D1 database
wrangler d1 create mochi-database

# This will output something like:
# ✅ Created D1 database 'mochi-database' (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
```

### 4. Update Wrangler Configuration

Edit `backend/wrangler.toml`:

```toml
name = "mochi-api"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[env.production]
name = "mochi-api-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "mochi-database"
database_id = "your-database-id-here"

[env.development]
name = "mochi-api-dev"

[[env.development.d1_databases]]
binding = "DB"
database_name = "mochi-database-dev"
database_id = "your-dev-database-id-here"
```

## 🗄️ Database Migration

### 1. Generate Migrations

```bash
# Generate migration files
npm run db:generate
```

### 2. Apply Migrations to D1

```bash
# Apply migrations to D1 database
wrangler d1 migrations apply mochi-database --local
wrangler d1 migrations apply mochi-database
```

### 3. Seed Production Database

```bash
# Seed with sample data (you'll need to create a script for D1)
wrangler d1 execute mochi-database --local --file=./seed-data.sql
```

## 🚀 Deployment

### 1. Deploy to Cloudflare Workers

```bash
# Deploy to development environment
npm run worker:deploy

# Deploy to production
wrangler deploy --env production
```

### 2. Verify Deployment

```bash
# Check deployment status
wrangler deployments list

# Test the API
curl https://mochi-api.your-subdomain.workers.dev/
```

## 📡 API Endpoints

### **Base URL**: `https://mochi-api.your-subdomain.workers.dev/api`

### **Health Check**
```
GET /
```

### **Token Endpoints**
```
GET    /api/tokens                    # Get all tokens
GET    /api/tokens/search?q=ETH       # Search tokens
GET    /api/tokens/top/volume         # Top tokens by volume
GET    /api/tokens/top/marketcap      # Top tokens by market cap
GET    /api/tokens/:address           # Get token by address
```

### **Swap Endpoints**
```
GET    /api/swap/quote                # Get swap quote
POST   /api/swap/execute              # Execute swap
GET    /api/swap/history/:address     # Get swap history
GET    /api/swap/recent               # Recent swaps
GET    /api/swap/stats                # Swap statistics
```

### **Liquidity Endpoints**
```
POST   /api/liquidity/add             # Add liquidity
POST   /api/liquidity/remove          # Remove liquidity
GET    /api/liquidity/positions/:provider  # User positions
GET    /api/liquidity/pools           # All pools
GET    /api/liquidity/pool/:address   # Pool stats
GET    /api/liquidity/events          # Liquidity events
```

### **Analytics Endpoints**
```
GET    /api/analytics/overview        # mochi overview
```

## 🔧 Environment Variables

### **Local Development**
Create `.dev.vars` file:

```env
ENVIRONMENT=development
CORS_ORIGIN=http://localhost:3000
```

### **Production**
Set in Cloudflare Dashboard or via Wrangler:

```bash
wrangler secret put ENVIRONMENT
wrangler secret put CORS_ORIGIN
```

## 🧪 Testing

### 1. Test API Endpoints

```bash
# Health check
curl https://mochi-api.your-subdomain.workers.dev/

# Get tokens
curl https://mochi-api.your-subdomain.workers.dev/api/tokens

# Get swap quote
curl "https://mochi-api.your-subdomain.workers.dev/api/swap/quote?tokenIn=0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8&tokenOut=0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8&amountIn=1000000000000000000&chainId=1"
```

### 2. Test Frontend Integration

Update frontend API base URL:

```javascript
// In frontend/src/config/api.js
const API_BASE_URL = 'https://mochi-api.your-subdomain.workers.dev/api';
```

## 📊 Monitoring

### 1. Cloudflare Analytics

- **Workers Analytics**: Monitor request volume, errors, and performance
- **D1 Analytics**: Track database queries and performance
- **Real-time Metrics**: View live traffic and error rates

### 2. Logs and Debugging

```bash
# View real-time logs
wrangler tail

# View specific deployment logs
wrangler tail --format=pretty
```

### 3. Performance Monitoring

- **Response Times**: Monitor API response times
- **Error Rates**: Track 4xx and 5xx errors
- **Database Performance**: Monitor D1 query performance

## 🔒 Security Considerations

### 1. CORS Configuration

```javascript
// In worker.js
app.use('*', cors({
  origin: ['https://your-frontend-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### 2. Rate Limiting

Consider implementing rate limiting for production:

```javascript
import { rateLimit } from 'hono/rate-limit';

app.use('/api/*', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 3. Input Validation

All endpoints include input validation and error handling.

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   ```bash
   # Check D1 database binding
   wrangler d1 list
   ```

2. **CORS Errors**
   - Verify CORS origin configuration
   - Check frontend domain in CORS settings

3. **Deployment Failures**
   ```bash
   # Check deployment logs
   wrangler deployments list
   wrangler tail
   ```

4. **Performance Issues**
   - Monitor D1 query performance
   - Check Workers CPU time limits

## 📈 Scaling Considerations

### **Automatic Scaling**
- Cloudflare Workers automatically scale based on traffic
- No manual scaling configuration required
- Global edge deployment for low latency

### **Database Scaling**
- D1 automatically handles read scaling
- Consider read replicas for high-traffic applications
- Monitor query performance and optimize as needed

### **Cost Optimization**
- Monitor Workers CPU time usage
- Optimize database queries
- Use caching where appropriate

## 🎯 Next Steps

1. **Deploy Smart Contracts** to Sepolia testnet
2. **Connect Frontend** to the deployed API
3. **Set up Monitoring** and alerting
4. **Implement Authentication** if required
5. **Add Rate Limiting** for production
6. **Set up CI/CD** pipeline

---

## 📞 Support

For issues or questions:
1. Check Cloudflare Workers documentation
2. Review Hono framework documentation
3. Check D1 database documentation
4. Monitor Cloudflare status page

**Happy Deploying! 🚀** 