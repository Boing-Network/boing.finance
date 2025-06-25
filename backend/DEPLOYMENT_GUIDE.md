# Cloudflare Workers Deployment Guide

This guide will help you deploy your DEX backend to Cloudflare Workers with D1 database.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Authentication**: Run `wrangler login` to authenticate

## Step 1: Set Up D1 Database

### Create D1 Database
```bash
# Create development database
wrangler d1 create dex-database

# Create staging database
wrangler d1 create dex-database-staging

# Create production database
wrangler d1 create dex-database-prod
```

### Update wrangler.toml
Replace the empty `database_id` values in `wrangler.toml` with the IDs from the commands above:

```toml
[[d1_databases]]
binding = "DB"
database_name = "dex-database"
database_id = "your-actual-database-id-here"
```

### Initialize Database Schema
```bash
# Generate SQL migration from your schema
npm run db:generate

# Apply migrations to D1 (you'll need to manually run the SQL)
wrangler d1 execute dex-database --file=./drizzle/0000_pink_xorn.sql
```

## Step 2: Configure Environment Variables

### Set Secrets (if needed)
```bash
# Set RPC URLs
wrangler secret put ETHEREUM_RPC_URL
wrangler secret put POLYGON_RPC_URL
wrangler secret put BSC_RPC_URL
wrangler secret put SEPOLIA_RPC_URL

# Set API keys
wrangler secret put ETHERSCAN_API_KEY
wrangler secret put JWT_SECRET
```

### Update Frontend Configuration
In `frontend/src/config.js`, update the URLs with your actual Cloudflare Workers domains:

```javascript
staging: {
  apiUrl: 'https://dex-api-staging.your-subdomain.workers.dev/api',
  workerUrl: 'https://dex-api-staging.your-subdomain.workers.dev/api',
  environment: 'staging'
},
production: {
  apiUrl: 'https://dex-api-prod.your-subdomain.workers.dev/api',
  workerUrl: 'https://dex-api-prod.your-subdomain.workers.dev/api',
  environment: 'production'
}
```

## Step 3: Deploy to Cloudflare Workers

### Development Deployment
```bash
# Deploy to development environment
npm run worker:deploy
```

### Staging Deployment
```bash
# Deploy to staging environment
npm run worker:deploy:staging
```

### Production Deployment
```bash
# Deploy to production environment
npm run worker:deploy:prod
```

## Step 4: Test Your Deployment

### Health Check
```bash
# Test the health endpoint
curl https://your-worker-domain.workers.dev/
```

### API Test
```bash
# Test the tokens endpoint
curl https://your-worker-domain.workers.dev/api/tokens
```

## Step 5: Frontend Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Deploy to Cloudflare Pages
1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your GitHub repository
4. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `build`
   - Root directory: `frontend`

### Environment Variables for Frontend
Set these in Cloudflare Pages:
- `REACT_APP_ENV`: `staging` or `production`

## Troubleshooting

### Common Issues

1. **"Database not found"**
   - Ensure D1 database is created and ID is correct in wrangler.toml
   - Check that migrations have been applied

2. **"CORS errors"**
   - Update CORS origins in `src/worker.js` and `src/index.js`
   - Add your frontend domain to the allowed origins

3. **"Module not found"**
   - Ensure all dependencies are in package.json
   - Check that better-sqlite3 is only used in local development

4. **"Worker timeout"**
   - Increase CPU time limit in wrangler.toml
   - Optimize database queries

### Debugging

```bash
# View worker logs
wrangler tail

# Test locally with wrangler
wrangler dev

# Check D1 database
wrangler d1 execute dex-database --command="SELECT * FROM tokens LIMIT 5;"
```

## Performance Optimization

1. **Database Indexing**: Add indexes to frequently queried columns
2. **Caching**: Use Cloudflare KV for caching frequently accessed data
3. **Connection Pooling**: D1 handles this automatically
4. **Query Optimization**: Use prepared statements and limit result sets

## Security Considerations

1. **Environment Variables**: Use secrets for sensitive data
2. **CORS**: Restrict origins to your domains only
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Input Validation**: Validate all user inputs
5. **HTTPS**: Cloudflare Workers are HTTPS-only

## Monitoring

1. **Cloudflare Analytics**: Monitor requests and performance
2. **Error Tracking**: Set up error monitoring
3. **Database Monitoring**: Monitor D1 query performance
4. **Uptime Monitoring**: Set up uptime checks

## Cost Optimization

1. **Request Optimization**: Minimize API calls
2. **Caching**: Use KV for expensive operations
3. **Database Optimization**: Optimize queries and indexes
4. **Resource Limits**: Monitor CPU and memory usage 