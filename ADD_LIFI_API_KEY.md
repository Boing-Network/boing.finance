# Adding LiFi API Key to Cloudflare

## Your LiFi API Key
```
deaa8b29-3d06-4d24-aca7-9f9aa3564b42.5293db2a-1885-4f20-9b62-2e8093e0a5ed
```

## Important Note

**Cloudflare Pages environment variables CANNOT be set via CLI** - they must be set via the Cloudflare Dashboard. This is a limitation of Cloudflare Pages.

However, I can:
1. ✅ Add it to your local `.env` file for development
2. ✅ Provide step-by-step instructions for adding it to Cloudflare Pages dashboard

## Step 1: Add to Local Development (Done)

I'll add it to your local `.env` file so it works in development.

## Step 2: Add to Cloudflare Pages (You Need to Do This)

Since Cloudflare Pages doesn't support CLI for environment variables, you need to add it via the dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to: **Workers & Pages** → **Pages** → **`boing-finance-prod`**
3. Click on **Settings** tab
4. Scroll down to **Environment Variables** section
5. Click **Add variable** (or edit if it exists)
6. Add:
   - **Variable name**: `REACT_APP_LIFI_API_KEY`
   - **Value**: `deaa8b29-3d06-4d24-aca7-9f9aa3564b42.5293db2a-1885-4f20-9b62-2e8093e0a5ed`
   - **Environment**: Select **Production** (and optionally **Preview** for staging)
7. Click **Save**

## Step 3: Redeploy (Optional)

After adding the environment variable, you may need to trigger a new deployment:
- Go to **Deployments** tab
- Click **Retry deployment** on the latest deployment, OR
- Push a new commit to trigger automatic deployment

## Verification

Once added, your Bridge feature will automatically use the LiFi API for better bridge route aggregation!

---

**Note**: The backend Workers don't need the LiFi API key - it's only used in the frontend.

