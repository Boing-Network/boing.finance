# GitHub Actions Deployment Setup Guide

## Cloudflare Authentication Issue

If you're seeing the error:
```
✘ [ERROR] A request to the Cloudflare API (/memberships) failed.
  Unable to authenticate request [code: 10001]
```

This means the GitHub Actions workflow cannot authenticate with Cloudflare.

## Solution: Set Up GitHub Secrets

You need to add your Cloudflare API token to GitHub repository secrets.

### Step 1: Get Your Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template, or create a custom token with these permissions:
   - **Account** - Workers Scripts:Edit
   - **Account** - Workers KV Storage:Edit
   - **Account** - Account Settings:Read
   - **Zone** - Zone Settings:Read
   - **User** - User Details:Read
4. Copy the generated token (you won't see it again!)

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

   **Secret 1: `CLOUDFLARE_API_TOKEN`**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Your Cloudflare API token from Step 1

   **Secret 2: `CLOUDFLARE_ACCOUNT_ID`**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: `10374f367672f4d19db430601db0926b` (your account ID)

### Step 3: Verify Setup

After adding the secrets, the next deployment should work. The workflow will:
1. Use the API token to authenticate
2. Deploy to Cloudflare Workers
3. Complete successfully

## Alternative: Use Wrangler Login (Not Recommended for CI/CD)

For local development, you can use:
```bash
wrangler login
```

But this won't work in GitHub Actions - you must use API tokens.

## Troubleshooting

### Error: "Unable to authenticate request [code: 10001]"
- ✅ Check that `CLOUDFLARE_API_TOKEN` is set in GitHub Secrets
- ✅ Verify the token has the correct permissions
- ✅ Make sure the token hasn't expired
- ✅ Check that `CLOUDFLARE_ACCOUNT_ID` is set correctly

### Error: "Account ID mismatch"
- ✅ Verify the account ID in `wrangler.toml` matches your Cloudflare account
- ✅ Check that the API token belongs to the correct account

### Error: "Insufficient permissions"
- ✅ Create a new API token with all required permissions
- ✅ Use the "Edit Cloudflare Workers" template for easiest setup

## Current Configuration

- **Account ID**: `10374f367672f4d19db430601db0926b`
- **Production Worker**: `boing-api-prod`
- **Staging Worker**: `boing-api-staging`

## Security Notes

- ⚠️ Never commit API tokens to the repository
- ✅ Always use GitHub Secrets for sensitive data
- ✅ Rotate tokens periodically
- ✅ Use least-privilege permissions

