# Environment Variables Guide for boing-finance-prod

## ✅ Currently Set (Required)
- ✅ `REACT_APP_ENVIRONMENT=production`
- ✅ `REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev`

## 📋 Additional Variables (Optional)

These are **optional** because they're already baked into your build via `wrangler.toml`. However, setting them as environment variables allows you to update them without rebuilding.

### IPFS Storage Services (Optional)
These are used for decentralized file storage (token metadata, images, etc.):

```
REACT_APP_PINATA_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_STORACHA_API_KEY=did:key:z6MkfchCVK3t4rZxwADxyQYqNNorsAGHsMFiocoNKo2aa3Wx
REACT_APP_NFT_STORAGE_API_KEY=be2d6a2e.3fd4535a32d44b0188fd1b35ee48bd93
REACT_APP_WEB3_STORAGE_API_KEY=<your-key-if-you-have-one>
```

**Note**: IPFS services are disabled in the code (R2 is primary storage). These variables are not needed unless you plan to enable IPFS services.

### Infura RPC (Optional)
Used for blockchain RPC connections:

```
REACT_APP_INFURA_PROJECT_ID=<your-project-id>
REACT_APP_INFURA_PROJECT_SECRET=<your-project-secret>
```

**Note**: The code has fallback RPC URLs, so this is optional unless you want to use your own Infura endpoints.

### Custom RPC URLs (Optional)
If you want to override default RPC endpoints:

```
REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
REACT_APP_POLYGON_RPC_URL=https://polygon-rpc.com
REACT_APP_BSC_RPC_URL=https://bsc-dataseed.binance.org
REACT_APP_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
REACT_APP_OPTIMISM_RPC_URL=https://mainnet.optimism.io
REACT_APP_BASE_RPC_URL=https://mainnet.base.org
```

**Note**: These have defaults, so they're optional.

## 🔐 Secrets vs Environment Variables

**Important**: All `REACT_APP_*` variables are **public** - they get exposed in the frontend JavaScript bundle. Cloudflare Pages has a separate "Secrets" feature for truly sensitive data, but for frontend React apps, you should only use public API keys.

**Do NOT use Cloudflare Pages Secrets for REACT_APP_* variables** - they won't be accessible in the browser.

## ✅ Current Status

### Required Variables (Set ✅)
- ✅ `REACT_APP_ENVIRONMENT=production`
- ✅ `REACT_APP_BACKEND_URL=https://boing-api-prod.nico-chikuji.workers.dev`

### Optional Variables (Already in Build)
- ⚠️ IPFS keys are in `wrangler.toml` (baked into build)
- ⚠️ RPC URLs have defaults in code

## 🎯 Recommendation

**You're all set!** The two required variables are set. The optional variables are already baked into your build, so you don't need to set them unless you want to update them without rebuilding.

## 🔍 Verification

To verify your environment variables are working:

1. Visit https://boing.finance
2. Open browser DevTools → Console
3. Check for any API connection errors
4. Test features that require backend connection

## 📝 Summary

- ✅ **Required variables**: Set
- ⚠️ **Optional variables**: Already in build (no need to set unless updating)
- ✅ **Project**: `boing-finance-prod` is correctly configured for https://boing.finance
- ✅ **Custom domains**: `boing.finance` and `www.boing.finance` are set

**You're ready to go!** 🚀

