# boing - Decentralized Exchange

A modern decentralized exchange built with React, Cloudflare Workers, and D1 database. Supports cross-chain trading with optimized performance and scalability.

## 🚀 Features

- **Cross-Chain Trading**: Trade tokens across different blockchains
- **Liquidity Pools**: Provide liquidity and earn trading fees
- **Real-time Analytics**: Track trading performance and market data
- **Cloudflare Workers**: Serverless backend with global edge deployment
- **D1 Database**: Fast, reliable SQLite-based database
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## 🏗️ Architecture

```
├── frontend/          # React application
├── backend/           # Cloudflare Workers API
└── contracts/         # Smart contracts (Solidity)
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Query** - Data fetching and caching
- **Ethers.js** - Ethereum interaction

### Backend
- **Cloudflare Workers** - Serverless runtime
- **Hono** - Fast web framework
- **D1 Database** - SQLite-based edge database
- **Drizzle ORM** - Type-safe database queries
- **Better-SQLite3** - Local development database

### Smart Contracts
- **Solidity** - Smart contract language
- **Hardhat** - Development framework
- **OpenZeppelin** - Secure contract libraries

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Cloudflare account (for deployment)

### 1. Clone Repository

```bash
git clone <repository-url>
cd boing
```

### 2. Backend Setup

```bash
cd backend
npm install

# Set up local database
npm run setup

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm start
```

### 4. Smart Contracts (Optional)

```bash
cd contracts
npm install

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

## 🌐 Deployment

### Automated Deployment (Recommended)

**GitHub Actions** workflows are configured for automatic deployment:

- **Push to `main` branch** → Deploys to **production**
- **Push to `staging` branch** → Deploys to **staging**

**Setup Required:**
1. Add GitHub Secrets:
   - `CLOUDFLARE_API_TOKEN` - Get from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare Dashboard sidebar

2. See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for detailed setup instructions.

**Workflows:**
- `.github/workflows/deploy-backend.yml` - Deploys Workers
- `.github/workflows/deploy-frontend.yml` - Deploys Pages
- `.github/workflows/ci.yml` - Runs tests and linting

### Manual Deployment

#### Cloudflare Workers Setup

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create D1 Database**
   ```bash
   cd backend
   wrangler d1 create boing-database
   ```

3. **Generate Migration Files**
   ```bash
   npm run d1:generate
   ```

4. **Apply Database Schema**
   ```bash
   wrangler d1 execute boing-database --file=./d1-schema.sql
   ```

5. **Update Configuration**
   - Edit `wrangler.toml` with your database ID
   - Update `frontend/src/config.js` with your worker URLs

6. **Deploy Backend**
   ```bash
   cd backend
   
   # Staging
   npm run deploy:staging
   # or: wrangler deploy --env staging
   # Deploys to: boing-api-staging
   
   # Production
   npm run deploy:prod
   # or: wrangler deploy --env production
   # Deploys to: boing-api-prod
   
   # Local Development (no deployment)
   npm run dev
   # Uses: wrangler dev (local only, uses base "boing-api" name)
   ```
   
   **Note**: The base `boing-api` worker is for local development only. 
   Production deployments use environment-specific workers (`boing-api-prod` and `boing-api-staging`).

#### Frontend Deployment

**Option 1: Manual Script**
```bash
# From project root
./deploy-frontend.sh staging   # Deploy to staging
./deploy-frontend.sh production # Deploy to production
```

**Option 2: Cloudflare Pages Auto-Deploy**
1. Connect your GitHub repository in Cloudflare Pages dashboard
2. Set build settings:
   - Build command: `cd dex/frontend && npm install && npm run build`
   - Build output directory: `dex/frontend/build`
   - Root directory: `dex/frontend`
3. Set environment variables in Cloudflare Pages dashboard

**Option 3: Manual Wrangler**
```bash
cd frontend
npm run build:prod  # or build:staging
wrangler pages deploy build --project-name=boing-finance-prod
```

## 🔧 Configuration

### Environment Variables

#### Backend (Cloudflare Workers)
```bash
# Set via wrangler secret put
ETHEREUM_RPC_URL=your_rpc_url
POLYGON_RPC_URL=your_rpc_url
BSC_RPC_URL=your_rpc_url
SEPOLIA_RPC_URL=your_rpc_url
ETHERSCAN_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
```

#### Frontend
```bash
# Set in Cloudflare Pages
REACT_APP_ENV=production
```

### Database Configuration

The application automatically switches between:
- **Local Development**: Better-SQLite3 database
- **Production**: Cloudflare D1 database

## 📊 API Endpoints

### Health Check
- `GET /`