# API Keys Setup Guide

## Required API Keys for Enhancements

### 🔑 Essential APIs (Free Tiers Available)

#### 1. CoinGecko API (Required for Portfolio & Analytics)
**Purpose**: Token prices, market data, historical prices
**Free Tier**: 
- 50 calls/minute
- No API key needed for basic usage
- API key recommended for higher limits

**Setup**:
1. Visit: https://www.coingecko.com/en/api
2. Sign up for free account
3. Get your API key from dashboard
4. Add to Cloudflare Pages environment variables:
   ```
   REACT_APP_COINGECKO_API_KEY=your_api_key_here
   ```

**Usage**: Portfolio value calculation, price charts, market data

---

#### 2. Etherscan API (Required for Token Explorer)
**Purpose**: Transaction history, contract verification, token holder info
**Free Tier**: 
- 5 calls/second
- 100,000 calls/day

**Setup**:
1. Visit: https://etherscan.io/apis
2. Sign up for free account
3. Get your API key from dashboard
4. Add to Cloudflare Pages environment variables:
   ```
   REACT_APP_ETHERSCAN_API_KEY=your_api_key_here
   ```

**Note**: You'll need separate keys for different networks:
- Ethereum Mainnet: Etherscan
- Polygon: Polygonscan
- BSC: BscScan
- Sepolia: Etherscan (testnet)

**Usage**: Token details, transaction history, contract verification

---

### 📋 Optional APIs (Can be added later)

#### 3. Infura / Alchemy (Optional - for better RPC performance)
**Purpose**: Reliable blockchain RPC endpoints
**Free Tier**: Available
**Setup**: Only needed if you want dedicated RPC endpoints

#### 4. Email Service (Optional - for notifications)
**Purpose**: Send email notifications
**Options**:
- SendGrid (100 emails/day free)
- Mailgun (5,000 emails/month free)
- Resend (3,000 emails/month free)

---

## 🔧 Configuration Steps

### Step 1: Get API Keys
1. **CoinGecko**: https://www.coingecko.com/en/api
2. **Etherscan**: https://etherscan.io/apis

### Step 2: Add to Cloudflare Pages
1. Go to Cloudflare Dashboard
2. Navigate to: Workers & Pages → Pages → `boing-finance-prod`
3. Go to: Settings → Environment Variables
4. Add for **Production** environment:
   ```
   REACT_APP_COINGECKO_API_KEY=your_key
   REACT_APP_ETHERSCAN_API_KEY=your_key
   ```

### Step 3: Add to Local Development
Create `.env.local` in `dex/frontend/`:
```bash
REACT_APP_COINGECKO_API_KEY=your_key
REACT_APP_ETHERSCAN_API_KEY=your_key
```

---

## 🚀 Quick Start (Without API Keys)

**You can start development without API keys!**

- CoinGecko: Works without API key (50 calls/min limit)
- Etherscan: Works without API key (5 calls/sec limit)

API keys are only needed for:
- Higher rate limits
- Production scale usage
- Better reliability

---

## 📝 Current Status

**Required for immediate implementation:**
- ✅ CoinGecko API (can start without key, add later)
- ✅ Etherscan API (can start without key, add later)

**Can be added later:**
- Email service (for notifications)
- Dedicated RPC endpoints (for better performance)

---

## 🔍 Testing API Keys

Once you add the keys, you can test them:

```javascript
// Test CoinGecko
fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')

// Test Etherscan
fetch('https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=YOUR_KEY')
```

---

**Note**: All enhancements will work with free tiers. API keys are optional but recommended for production.

