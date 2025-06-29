# 🚀 Cloudflare Deployment Guide for boing.finance

This guide covers deploying both the frontend (Cloudflare Pages) and backend (Cloudflare Workers) to Cloudflare.

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Domain**: Optional but recommended (boing.finance)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │  Cloudflare      │    │   Cloudflare    │
│   Pages         │◄──►│   Workers        │◄──►│   D1 Database   │
│   (Frontend)    │    │   (Backend API)  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Setup Steps

### 1. **Login to Cloudflare**
```bash
wrangler login
```

### 2. **Create D1 Database**
```bash
# Create development database
wrangler d1 create boing-database

# Create production database
wrangler d1 create boing-database-prod

# Create staging database
wrangler d1 create boing-database-staging
```

### 3. **Update Configuration Files**

#### Backend (`backend/wrangler.toml`)
Update the database IDs in the configuration:
```toml
[[d1_databases]]
binding = "DB"
database_name = "boing-database"
database_id = "your-dev-database-id"

[env.production.d1_databases]
binding = "DB"
database_name = "boing-database-prod"
database_id = "your-prod-database-id"

[env.staging.d1_databases]
binding = "DB"
database_name = "boing-database-staging"
database_id = "your-staging-database-id"
```

#### Frontend Environment Variables
Update the API URLs in:
- `frontend/.env.production`
- `frontend/.env.staging`

### 4. **Set Environment Secrets**
```bash
# Backend secrets
cd backend
wrangler secret put ETHEREUM_RPC_URL
wrangler secret put POLYGON_RPC_URL
wrangler secret put BSC_RPC_URL
wrangler secret put SEPOLIA_RPC_URL
wrangler secret put ETHERSCAN_API_KEY
wrangler secret put JWT_SECRET

# Production secrets
wrangler secret put ETHEREUM_RPC_URL --env production
wrangler secret put POLYGON_RPC_URL --env production
wrangler secret put BSC_RPC_URL --env production
wrangler secret put SEPOLIA_RPC_URL --env production
wrangler secret put ETHERSCAN_API_KEY --env production
wrangler secret put JWT_SECRET --env production
```

## 🚀 Deployment

### **Option 1: Automated Scripts**
```bash
# Deploy everything to production
npm run deploy:prod

# Deploy everything to staging
npm run deploy:staging

# Deploy only backend
npm run deploy:backend:prod

# Deploy only frontend
npm run deploy:frontend:prod
```

### **Option 2: Manual Deployment**

#### Backend (Workers)
```bash
cd backend

# Development
wrangler deploy

# Staging
wrangler deploy --env staging

# Production
wrangler deploy --env production
```

#### Frontend (Pages)
```bash
cd frontend

# Build for production
npm run build:prod

# Deploy to Pages
wrangler pages deploy build --project-name=boing-finance
```

### **Option 3: GitHub Integration (Recommended)**

#### 1. **Connect GitHub Repository**
- Go to Cloudflare Dashboard
- Navigate to Pages
- Create new project
- Connect your GitHub repository

#### 2. **Configure Build Settings**
- **Build command**: `npm run build:prod`
- **Build output directory**: `build`
- **Root directory**: `frontend`

#### 3. **Environment Variables**
Set in Cloudflare Pages dashboard:
- `REACT_APP_API_URL`: `https://boing-api.your-subdomain.workers.dev`
- `REACT_APP_ENVIRONMENT`: `production`

## 🌐 Domain Configuration

### **Custom Domain Setup**
1. **Add Domain to Cloudflare**
   - Add `boing.finance` to your Cloudflare account
   - Update nameservers at your registrar

2. **Configure Pages Domain**
   - Go to Pages project settings
   - Add custom domain: `boing.finance`
   - Enable HTTPS

3. **Configure Workers Domain**
   - Go to Workers project settings
   - Add custom domain: `api.boing.finance`

## 📊 Monitoring & Analytics

### **Cloudflare Analytics**
- **Pages Analytics**: Built-in performance metrics
- **Workers Analytics**: Request counts, errors, CPU time
- **D1 Analytics**: Query performance, storage usage

### **Custom Monitoring**
```bash
# Check deployment status
wrangler deployments list

# View logs
wrangler tail

# Test API endpoints
curl https://boing-api.your-subdomain.workers.dev/health
```

## 🔄 CI/CD Pipeline

### **GitHub Actions Workflow**
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Wrangler
        run: npm install -g wrangler
        
      - name: Deploy Backend
        run: |
          cd backend
          npm install
          wrangler deploy --env ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          
      - name: Deploy Frontend
        run: |
          cd frontend
          npm install
          npm run build:${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }}
          wrangler pages deploy build --project-name=boing-finance
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **Build Failures**
   ```bash
   # Clear cache
   npm run build -- --reset-cache
   
   # Check for missing dependencies
   npm install
   ```

2. **Database Connection Issues**
   ```bash
   # Test D1 connection
   wrangler d1 execute boing-database --local --command="SELECT 1"
   ```

3. **Environment Variables**
   ```bash
   # List all secrets
   wrangler secret list
   
   # Update secret
   wrangler secret put SECRET_NAME
   ```

### **Performance Optimization**

1. **Frontend**
   - Enable Cloudflare Pages compression
   - Use CDN caching headers
   - Optimize bundle size

2. **Backend**
   - Use D1 connection pooling
   - Implement caching with KV
   - Optimize Worker CPU usage

## 📈 Scaling Considerations

### **Automatic Scaling**
- **Pages**: Automatically scales with traffic
- **Workers**: Scales to 0 when not in use
- **D1**: Handles concurrent connections automatically

### **Cost Optimization**
- Monitor CPU usage in Workers
- Use KV for caching expensive operations
- Implement request batching

## 🔒 Security

### **Best Practices**
1. **Environment Variables**: Never commit secrets
2. **CORS**: Configure properly for production
3. **Rate Limiting**: Implement in Workers
4. **Input Validation**: Validate all API inputs
5. **HTTPS**: Always enabled on Cloudflare

### **Security Headers**
Add to your Worker response:
```javascript
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

## 📞 Support

- **Cloudflare Documentation**: [developers.cloudflare.com](https://developers.cloudflare.com)
- **Wrangler CLI**: [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler)
- **Community**: [community.cloudflare.com](https://community.cloudflare.com)

---

**Happy Deploying! 🚀** 