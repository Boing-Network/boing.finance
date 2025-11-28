# Custom Domain Migration Guide

## Current Situation

**Staging Project (`boing-finance`):**
- ✅ `boing-finance.pages.dev` (default - keep this)
- ❌ `boing.finance` (should be on production)
- ❌ `www.boing.finance` (should be on production)

**Production Project (`boing-finance-prod`):**
- ✅ `boing-finance-prod.pages.dev` (default - keep this)
- ❌ Missing: `boing.finance` (needs to be added)
- ❌ Missing: `www.boing.finance` (needs to be added)

## ✅ Correct Configuration

### Production Project (`boing-finance-prod`)
Should have:
- `boing-finance-prod.pages.dev` (default)
- `boing.finance` (custom domain)
- `www.boing.finance` (custom domain)

### Staging Project (`boing-finance`)
Should have:
- `boing-finance.pages.dev` (default only)
- Optional: `staging.boing.finance` (if you want a staging custom domain)

## 🔄 Migration Steps

### Step 1: Remove Custom Domains from Staging

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click on **`boing-finance`** (staging project)
4. Go to **Custom domains** tab
5. For each custom domain (`boing.finance` and `www.boing.finance`):
   - Click the **three dots (⋯)** next to the domain
   - Select **Remove domain**
   - Confirm removal

### Step 2: Add Custom Domains to Production

1. Still in Cloudflare Dashboard → **Workers & Pages** → **Pages**
2. Click on **`boing-finance-prod`** (production project)
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `boing.finance`
   - Cloudflare will automatically detect DNS records
   - If DNS is already configured, it should activate quickly
6. Click **Set up a custom domain** again
7. Enter: `www.boing.finance`
   - Cloudflare will set up the DNS automatically
   - This may take a few minutes to propagate

### Step 3: Verify DNS Configuration

After adding domains, verify DNS records:

**For `boing.finance`:**
- Should have a CNAME record pointing to the Pages project
- Cloudflare will show the required DNS configuration

**For `www.boing.finance`:**
- Should have a CNAME record pointing to the Pages project
- Cloudflare will show the required DNS configuration

### Step 4: Wait for Propagation

- DNS changes can take 5-30 minutes to propagate
- Check domain status in the Custom domains tab
- Status should show "Active" when ready

## ✅ Final Configuration

After migration:

**Production (`boing-finance-prod`):**
- ✅ `boing-finance-prod.pages.dev`
- ✅ `boing.finance`
- ✅ `www.boing.finance`

**Staging (`boing-finance`):**
- ✅ `boing-finance.pages.dev` (only)

## 🔍 Verification

1. **Test Production Domains:**
   - https://boing.finance (should load production site)
   - https://www.boing.finance (should load production site)

2. **Test Staging:**
   - https://boing-finance.pages.dev (should load staging site)

3. **Check in Dashboard:**
   - Verify domains are listed under correct projects
   - All domains show "Active" status

## ⚠️ Important Notes

- **DNS Propagation**: Changes can take 5-30 minutes
- **SSL Certificates**: Cloudflare automatically provisions SSL certificates
- **No Downtime**: Removing from staging and adding to production can be done simultaneously
- **Backup**: The `.pages.dev` URLs will always work as fallback

## 🆘 Troubleshooting

### Domain Already in Use Error
- Make sure you removed it from staging first
- Wait a few minutes after removal before adding to production

### DNS Not Resolving
- Check DNS records in Cloudflare DNS settings
- Verify CNAME records point to the correct Pages project
- Wait for DNS propagation (can take up to 30 minutes)

### SSL Certificate Issues
- Cloudflare automatically provisions SSL certificates
- May take 5-10 minutes after domain is added
- Check SSL/TLS settings in Cloudflare Dashboard

