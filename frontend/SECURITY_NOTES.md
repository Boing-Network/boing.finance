# Security Notes for Frontend Environment Variables

## Important Security Information

### ⚠️ Frontend API Keys Are Public

**All `REACT_APP_*` environment variables are exposed in the frontend JavaScript bundle.** This means:

- ✅ **Safe to expose**: Public API keys, read-only keys, keys with limited permissions
- ❌ **Never expose**: Secret keys, private keys, admin credentials, database passwords

### Current API Keys in Use

The following API keys are currently configured in `wrangler.toml`:

1. **REACT_APP_PINATA_API_KEY** - Pinata IPFS service
   - This is a JWT token for Pinata API
   - Should have limited permissions (upload only)
   - Can be regenerated if compromised

2. **REACT_APP_STORACHA_API_KEY** - Storacha Network
   - DID key for decentralized storage
   - Public identifier, safe to expose

3. **REACT_APP_NFT_STORAGE_API_KEY** - NFT.Storage
   - API key for NFT.Storage service
   - Should have limited permissions

### Best Practices

1. **Use Cloudflare Pages Environment Variables**
   - For production, set these in Cloudflare Pages dashboard
   - Go to: Pages → Your Project → Settings → Environment Variables
   - This keeps keys out of source control

2. **Rotate Keys Regularly**
   - Regenerate API keys periodically
   - Especially if they're exposed in public repositories

3. **Limit Key Permissions**
   - Only grant minimum required permissions
   - Use read-only keys when possible
   - Set rate limits on API keys

4. **Monitor Key Usage**
   - Set up alerts for unusual activity
   - Monitor API usage in service dashboards

### Moving to Cloudflare Pages Environment Variables

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **boing-finance** (or your project)
3. Go to **Settings** → **Environment Variables**
4. Add each `REACT_APP_*` variable:
   - Production environment
   - Preview environment (optional)
5. Remove hardcoded values from `wrangler.toml`
6. Redeploy the application

### Environment Variable Priority

Cloudflare Pages uses this priority order:
1. Environment-specific variables (production/preview)
2. Variables in `wrangler.toml`
3. Build-time environment variables

### Sensitive Keys (Backend Only)

For sensitive keys (database passwords, private keys, etc.):
- ✅ Use Cloudflare Workers secrets: `wrangler secret put KEY_NAME`
- ✅ Never use `REACT_APP_*` prefix
- ✅ Keep in backend environment only

### Checklist

- [ ] Review all API keys in `wrangler.toml`
- [ ] Verify keys have limited permissions
- [ ] Move production keys to Cloudflare Pages environment variables
- [ ] Remove hardcoded keys from `wrangler.toml` (keep in Cloudflare)
- [ ] Document required environment variables in README
- [ ] Set up key rotation schedule
- [ ] Monitor API key usage

