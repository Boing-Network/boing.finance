# Production Configuration Checklist

## ✅ Custom Domains (Completed)
- ✅ `boing.finance` - Set in `boing-finance-prod` project
- ✅ `www.boing.finance` - Set in `boing-finance-prod` project

## ⚙️ Essential Configuration Settings

### 1. Security Headers & Redirects (✅ Configured)
- ✅ `_headers` file - Security headers configured
- ✅ `_redirects` file - www to non-www redirects configured
- ✅ Files are in `public/` folder and will be deployed automatically

### 2. Environment Variables (⚠️ Recommended via Dashboard)

**Note**: Environment variables for Cloudflare Pages must be set via the Dashboard (not CLI).

**Required for Production:**
```
REACT_APP_ENVIRONMENT=production
REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev
```

**Optional (if you want to override build-time values):**
```
REACT_APP_PINATA_API_KEY=<your-key>
REACT_APP_STORACHA_API_KEY=<your-key>
REACT_APP_NFT_STORAGE_API_KEY=<your-key>
REACT_APP_INFURA_PROJECT_ID=<your-id>
REACT_APP_INFURA_PROJECT_SECRET=<your-secret>
REACT_APP_WEB3_STORAGE_API_KEY=<your-key>
```

**How to Set:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages** → **`boing-finance-prod`**
3. Go to **Settings** → **Environment Variables**
4. Add variables for **Production** environment
5. Click **Save**

**Note**: These are already baked into the build via `wrangler.toml`, but setting them as environment variables allows for easier updates without rebuilding.

### 3. Build Settings (✅ Already Configured)
- ✅ Build output directory: `build`
- ✅ Compatibility date: `2024-01-01`
- ✅ Production branch: `main` (auto-deploys on push)

### 4. SSL/TLS (✅ Automatic)
- ✅ Cloudflare automatically provisions SSL certificates for custom domains
- ✅ HTTPS is enforced via redirects

### 5. DNS Configuration (✅ Should be Automatic)
- ✅ Custom domains should automatically configure DNS
- ✅ Verify DNS records in Cloudflare Dashboard if needed

## 🔍 Verification Steps

### 1. Test Custom Domains
```bash
# Test production domain
curl -I https://boing.finance

# Test www redirect
curl -I https://www.boing.finance

# Should redirect to https://boing.finance
```

### 2. Check Security Headers
```bash
curl -I https://boing.finance | grep -i "x-frame-options\|x-content-type-options\|referrer-policy"
```

### 3. Verify SSL Certificate
- Visit https://boing.finance in browser
- Check for valid SSL certificate (green lock icon)

### 4. Test SPA Routing
- Visit https://boing.finance/swap
- Should load the app (not 404)

## 📋 Current Status

### ✅ Completed
- ✅ Custom domains configured
- ✅ Security headers configured
- ✅ Redirects configured
- ✅ Build settings configured

### ⚠️ Optional (Recommended)
- ⚠️ Environment variables via Dashboard (for easier updates)

## 🚀 Next Steps

1. **Set Environment Variables** (Optional but Recommended)
   - Go to Dashboard → Pages → `boing-finance-prod` → Settings → Environment Variables
   - Add production environment variables

2. **Verify Deployment**
   - Visit https://boing.finance
   - Test all features
   - Check browser console for errors

3. **Monitor**
   - Check Cloudflare Analytics
   - Monitor error rates
   - Check SSL certificate status

## 🔗 Quick Links

- **Production Site**: https://boing.finance
- **Production API**: https://boing-api-prod.nico-chikuji.workers.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com/

