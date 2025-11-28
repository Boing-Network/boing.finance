# Deployment Setup Guide

## Current Deployment Status

### ❌ **No Automatic Deployment Currently Configured**

Pushing to GitHub does **NOT** automatically deploy to Cloudflare Workers or Pages. You currently need to deploy manually using the deployment scripts.

---

## 🚀 Automated Deployment Setup

I've created GitHub Actions workflows for automated deployment. Here's how to set them up:

### 1. Required GitHub Secrets

You need to add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

#### Required Secrets:

- **`CLOUDFLARE_API_TOKEN`**
  - Get from: [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
  - Create a token with:
    - **Permissions**: 
      - Account: Cloudflare Workers:Edit
      - Account: Cloudflare Pages:Edit
    - **Account Resources**: Include your account

- **`CLOUDFLARE_ACCOUNT_ID`**
  - Get from: [Cloudflare Dashboard](https://dash.cloudflare.com/)
  - Found in the right sidebar of your dashboard
  - Format: 32-character hex string

### 2. GitHub Actions Workflows Created

I've created three workflow files:

1. **`.github/workflows/deploy-backend.yml`**
   - Deploys backend to Cloudflare Workers
   - Triggers on push to `main` or `staging` branches
   - Deploys to production when pushing to `main`
   - Deploys to staging when pushing to `staging`

2. **`.github/workflows/deploy-frontend.yml`**
   - Deploys frontend to Cloudflare Pages
   - Triggers on push to `main` or `staging` branches
   - Builds and deploys automatically

3. **`.github/workflows/ci.yml`**
   - Runs linting and build checks
   - Runs on pull requests and pushes
   - Prevents deployment of broken code

### 3. How It Works

#### Automatic Deployment:
- **Push to `main` branch** → Deploys to **production**
- **Push to `staging` branch** → Deploys to **staging**
- Only deploys when files in `dex/backend/` or `dex/frontend/` change

#### Manual Deployment:
- Go to **Actions** tab in GitHub
- Select workflow (Deploy Backend or Deploy Frontend)
- Click **Run workflow**
- Choose environment (production/staging)
- Click **Run workflow**

---

## 📋 Deployment Methods Comparison

### Current Setup (Manual)
- ✅ Simple and straightforward
- ❌ Requires manual action
- ❌ Easy to forget to deploy
- ❌ No automatic testing

### GitHub Actions (Recommended)
- ✅ Fully automated
- ✅ Deploys on every push
- ✅ Runs tests before deployment
- ✅ Deployment history in GitHub
- ✅ Rollback capabilities
- ⚠️ Requires GitHub secrets setup

### Cloudflare Pages Auto-Deploy (Alternative)
- ✅ Simple setup in Cloudflare dashboard
- ✅ Automatic deployments from GitHub
- ✅ Preview deployments for PRs
- ❌ Only works for Pages (not Workers)
- ❌ Less control over build process

---

## 🔧 Recommended Setup: Hybrid Approach

### Option 1: Full GitHub Actions (Recommended)

**Backend (Workers)**:
- Use GitHub Actions workflow (`.github/workflows/deploy-backend.yml`)
- Automatic deployment on push to `main`/`staging`

**Frontend (Pages)**:
- Use GitHub Actions workflow (`.github/workflows/deploy-frontend.yml`)
- OR use Cloudflare Pages auto-deploy (simpler, but less control)

### Option 2: Cloudflare Pages Auto-Deploy + Manual Workers

**Backend (Workers)**:
- Keep manual deployment or use GitHub Actions

**Frontend (Pages)**:
- Connect GitHub repo in Cloudflare Pages dashboard
- Set build settings:
  - Build command: `cd dex/frontend && npm install && npm run build`
  - Build output directory: `dex/frontend/build`
  - Root directory: `dex/frontend`

---

## 🎯 Setup Instructions

### Step 1: Add GitHub Secrets

```bash
# In GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret

# Add:
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

### Step 2: Get Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template
4. Add **Edit Cloudflare Pages** permission
5. Copy the token

### Step 3: Get Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Copy the **Account ID** from the right sidebar

### Step 4: Test Deployment

1. Push the workflow files to GitHub
2. Go to **Actions** tab
3. Manually trigger a workflow to test
4. Check deployment logs

---

## 📊 Deployment Workflow

### Production Deployment (main branch)
```
Push to main
  ↓
GitHub Actions triggered
  ↓
Install dependencies
  ↓
Build frontend (production)
  ↓
Deploy backend to boing-api-prod
  ↓
Deploy frontend to boing-finance-prod
  ↓
✅ Production live
```

### Staging Deployment (staging branch)
```
Push to staging
  ↓
GitHub Actions triggered
  ↓
Install dependencies
  ↓
Build frontend (staging)
  ↓
Deploy backend to boing-api-staging
  ↓
Deploy frontend to boing-finance
  ↓
✅ Staging live
```

---

## 🔍 Verification

After setting up automated deployment:

1. **Check GitHub Actions**:
   - Go to repository → **Actions** tab
   - You should see workflows running on pushes

2. **Verify Backend Deployment**:
   - Production: https://boing-api-prod.nico-chikuji.workers.dev
   - Staging: https://boing-api-staging.nico-chikuji.workers.dev

3. **Verify Frontend Deployment**:
   - Production: https://boing-finance-prod.pages.dev
   - Staging: https://boing-finance.pages.dev

---

## 🛠️ Troubleshooting

### Workflow Fails with "Authentication Error"
- Check that `CLOUDFLARE_API_TOKEN` is set correctly
- Verify token has correct permissions
- Token might have expired - create a new one

### Workflow Fails with "Account ID Error"
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct
- Check that it's a 32-character hex string

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs in GitHub Actions

### Deployment Succeeds but Site Doesn't Update
- Cloudflare Pages might need a few minutes to propagate
- Check Cloudflare Pages dashboard for deployment status
- Verify environment variables are set correctly

---

## 📝 Next Steps

1. ✅ **Add GitHub Secrets** (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
2. ✅ **Push workflow files to GitHub**
3. ✅ **Test with a manual workflow run**
4. ✅ **Verify automatic deployment on next push**

---

## 🔐 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate API tokens** periodically
4. **Use least-privilege tokens** (only necessary permissions)
5. **Monitor deployment logs** for suspicious activity

---

## 📚 Additional Resources

- [Cloudflare Workers Deployment](https://developers.cloudflare.com/workers/platform/deploying-workers/)
- [Cloudflare Pages Deployment](https://developers.cloudflare.com/pages/platform/git-integration/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

