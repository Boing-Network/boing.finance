# Adding LiFi API Key to Cloudflare Pages

## ⚠️ Important Note

**Cloudflare Pages environment variables CANNOT be set via CLI** - they must be set via the Cloudflare Dashboard. This is a limitation of Cloudflare Pages (unlike Workers which support `wrangler secret put`).

## ✅ What I've Done

1. ✅ Added LiFi API key to your local `.env` file (for development)
2. ✅ Added CoinGecko API key to Workers via CLI (for backend)

## 📋 What You Need to Do

Add the LiFi API key to Cloudflare Pages via the dashboard:

### Step-by-Step Instructions

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Log in to your account

2. **Navigate to Pages**
   - Click: **Workers & Pages** (left sidebar)
   - Click: **Pages**
   - Click on: **`boing-finance-prod`**

3. **Go to Settings**
   - Click the **Settings** tab (at the top)

4. **Add Environment Variable**
   - Scroll down to **Environment Variables** section
   - Click **Add variable** button
   - Fill in:
     - **Variable name**: `REACT_APP_LIFI_API_KEY`
     - **Value**: `deaa8b29-3d06-4d24-aca7-9f9aa3564b42.5293db2a-1885-4f20-9b62-2e8093e0a5ed`
     - **Environment**: Select **Production** (and optionally **Preview** for staging)
   - Click **Save**

5. **Redeploy (Optional)**
   - After adding, go to **Deployments** tab
   - Click **Retry deployment** on the latest deployment to apply the new environment variable

## ✅ Verification

Once added, your Bridge feature will automatically use the LiFi API for:
- Best bridge route finding
- Cross-chain token transfers
- Real-time bridge quotes

## 📝 Summary

- **Local Development**: ✅ Already configured (in `.env` file)
- **Cloudflare Pages**: ⚠️ Must be added via dashboard (see steps above)
- **Backend Workers**: ✅ Not needed (LiFi is frontend-only)

---

**Note**: The LiFi API key is safe to expose in the frontend - it's a public API key designed for client-side use.

