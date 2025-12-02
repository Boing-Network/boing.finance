# Cloudflare Workers Environment Variables

## Overview

Your backend Workers (`boing-api-prod` and `boing-api-staging`) need some environment variables for API integrations.

## Required Environment Variables

### For Backend Workers (Cloudflare Workers)

The backend uses CoinGecko API for token prices. You need to add this as a **secret** to your Workers.

#### How to Add Secrets to Cloudflare Workers

**Option 1: Using Cloudflare Dashboard (Recommended)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to: **Workers & Pages** → **Workers** → **`boing-api-prod`**
3. Go to: **Settings** → **Variables and Secrets**
4. Under **"Secrets"** section, click **"Add secret"**
5. Add:
   - **Name**: `COINGECKO_API_KEY`
   - **Value**: Your CoinGecko API key (optional, but recommended for higher limits)
6. Click **"Save"**
7. Repeat for **`boing-api-staging`** if needed

**Option 2: Using Wrangler CLI**

```bash
cd dex/backend
wrangler secret put COINGECKO_API_KEY --env production
# Enter your API key when prompted

wrangler secret put COINGECKO_API_KEY --env staging
# Enter your API key when prompted
```

### Optional: Etherscan API Key

If you want to add Etherscan API key for the backend (currently not used but may be in future):

```bash
wrangler secret put ETHERSCAN_API_KEY --env production
```

## Current Backend API Usage

The backend currently uses:
- ✅ **CoinGecko API** - For token prices (optional, works without key but with limits)
- ❌ **The Graph API** - Not used in backend (frontend only)
- ❌ **Alchemy API** - Not used in backend (frontend only)
- ❌ **LiFi/Socket API** - Not used in backend (frontend only)

## Frontend vs Backend Environment Variables

### Frontend (Cloudflare Pages)
These are added to **Pages** → **`boing-finance-prod`** → **Environment Variables**:
- `REACT_APP_THE_GRAPH_API_KEY`
- `REACT_APP_THE_GRAPH_API_TOKEN`
- `REACT_APP_ALCHEMY_API_KEY`
- `REACT_APP_LIFI_API_KEY` (optional)
- `REACT_APP_COINGECKO_API_KEY` (optional)
- `REACT_APP_ETHERSCAN_API_KEY` (optional)

### Backend (Cloudflare Workers)
These are added to **Workers** → **`boing-api-prod`** → **Secrets**:
- `COINGECKO_API_KEY` (optional, but recommended)

## Summary

**You've already added the frontend environment variables to Cloudflare Pages** ✅

**You should also add** (optional but recommended):
- `COINGECKO_API_KEY` to **Workers** → **`boing-api-prod`** → **Secrets**

This will give your backend API higher rate limits for CoinGecko calls.

---

**Note**: The backend will work without the CoinGecko API key, but with lower rate limits. Adding the key is recommended for production.

