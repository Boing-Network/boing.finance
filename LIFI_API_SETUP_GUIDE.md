# LiFi API Setup Guide (Bridge Aggregator)

## What is LiFi?

**LiFi** is a bridge aggregator that finds the best routes for cross-chain token transfers. It's an excellent alternative to Socket.tech and offers:

- **Free Tier**: Available with good limits
- **Easy Sign Up**: Simple registration process
- **Comprehensive API**: Well-documented REST API
- **Multiple Bridges**: Aggregates routes from 15+ bridge protocols

## Why Use LiFi?

1. **Free Tier Available**: Good limits for development and production
2. **Easy to Use**: Simple REST API (no GraphQL complexity)
3. **Well Documented**: Clear documentation at https://docs.li.fi/
4. **Reliable**: Used by many DeFi projects

## Sign Up Process

### Step 1: Visit LiFi Website
Go to: **https://li.fi/**

### Step 2: Navigate to Developer Portal
1. Click on **"Developers"** or **"API"** in the navigation
2. Or go directly to: **https://docs.li.fi/**

### Step 3: Create Account
1. Click **"Sign Up"** or **"Get Started"**
2. You can sign up with:
   - Email
   - GitHub account
   - Google account

### Step 4: Get API Key
1. After signing up, go to your **Dashboard**
2. Navigate to **"API Keys"** or **"Developer Settings"**
3. Click **"Create API Key"** or **"Generate Key"**
4. Copy your API key

### Step 5: Add to Environment Variables

Add to your `.env` file:
```bash
REACT_APP_LIFI_API_KEY=your_lifi_api_key_here
```

## LiFi API Endpoints

### Base URL
```
https://li.quest/v1
```

### Key Endpoints

#### 1. Get Quote (Bridge Route)
```
GET /quote
```
Get the best bridge route for a token transfer.

**Parameters:**
- `fromChain`: Source chain ID (e.g., 1 for Ethereum)
- `toChain`: Destination chain ID (e.g., 137 for Polygon)
- `fromToken`: Source token address
- `toToken`: Destination token address
- `fromAmount`: Amount to bridge
- `fromAddress`: User's wallet address

**Example:**
```javascript
const response = await fetch(
  `https://li.quest/v1/quote?fromChain=1&toChain=137&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&fromAmount=1000000000&fromAddress=0x...`,
  {
    headers: {
      'x-lifi-api-key': 'your_api_key_here'
    }
  }
);
```

#### 2. Get Supported Chains
```
GET /chains
```
Get all supported blockchain networks.

#### 3. Get Supported Tokens
```
GET /tokens?chains={chainId}
```
Get supported tokens for a specific chain.

#### 4. Get Transaction Status
```
GET /status?txHash={hash}&fromChain={chainId}
```
Get the status of a bridge transaction.

## Free Tier Limits

LiFi typically offers:
- **Free Tier**: 
  - Good request limits
  - All core features
  - Perfect for development and production

- **Paid Tiers**: 
  - Higher rate limits
  - Priority support
  - Advanced features

## Integration

The LiFi service is already created at `src/services/lifiService.js`. Just add your API key to environment variables and it will work!

## Comparison: LiFi vs Socket.tech

| Feature | LiFi | Socket.tech |
|---------|------|-------------|
| Free Tier | ✅ Yes | ⚠️ Limited |
| Sign Up | ✅ Easy | ⚠️ Complex |
| Documentation | ✅ Excellent | ✅ Good |
| API Type | REST | REST |
| Ease of Use | ✅ Very Easy | ⚠️ Moderate |

**Recommendation**: Use **LiFi** - it's easier to set up and has a better free tier!

## Next Steps

1. **Sign up** at https://li.fi/
2. **Get your API key** from the dashboard
3. **Add to environment variables**:
   ```
   REACT_APP_LIFI_API_KEY=your_key_here
   ```
4. **Add to Cloudflare Pages** environment variables
5. **Test** the integration

## Notes

- LiFi API is primarily for **bridge aggregation** (cross-chain transfers)
- The API key is **safe to expose** in frontend (it's a public API key)
- Consider rate limits when making requests
- Free tier is usually sufficient for most use cases

---

**Ready to integrate?** Once you have your LiFi API key, add it to environment variables and the Bridge feature will automatically use it!

