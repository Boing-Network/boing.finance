# Socket API Setup Guide

## What is Socket API?

**Socket** (formerly Bungee) is a bridge aggregator that finds the best routes for cross-chain token transfers across multiple bridge protocols. It aggregates routes from:
- Stargate
- Hop Protocol
- Across Protocol
- Celer Network
- Multichain
- And many more...

## Why Use Socket API?

1. **Best Routes**: Automatically finds the cheapest and fastest bridge routes
2. **Multi-Bridge Aggregation**: Compares routes across 15+ bridge protocols
3. **Real-time Quotes**: Get live quotes for bridge transactions
4. **Transaction Building**: Helps build bridge transactions

## Sign Up Process

### Step 1: Visit Socket Website
Go to: **https://socket.tech/**

### Step 2: Navigate to Developer Portal
1. Click on **"Developers"** or **"API"** in the navigation
2. Or go directly to: **https://docs.socket.tech/**

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
REACT_APP_SOCKET_API_KEY=your_socket_api_key_here
```

## Socket API Endpoints

### Base URL
```
https://api.socket.tech/v2
```

### Key Endpoints

#### 1. Get Quote (Bridge Route)
```
GET /quote
```
Get the best bridge route for a token transfer.

**Parameters:**
- `fromChainId`: Source chain ID (e.g., 1 for Ethereum)
- `toChainId`: Destination chain ID (e.g., 137 for Polygon)
- `fromTokenAddress`: Source token address
- `toTokenAddress`: Destination token address
- `amount`: Amount to bridge
- `userAddress`: User's wallet address

**Example:**
```javascript
const response = await fetch(
  `https://api.socket.tech/v2/quote?fromChainId=1&toChainId=137&fromTokenAddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toTokenAddress=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&amount=1000000000&userAddress=0x...`,
  {
    headers: {
      'API-KEY': 'your_api_key_here'
    }
  }
);
```

#### 2. Build Transaction
```
POST /build-tx
```
Build the transaction data for bridging.

#### 3. Get Token Lists
```
GET /token-lists
```
Get supported tokens for each chain.

#### 4. Get Chain Status
```
GET /chains
```
Get status of all supported chains.

## Free Tier Limits

Socket typically offers:
- **Free Tier**: 
  - Limited requests per day
  - Basic features
  - Good for development and testing

- **Paid Tiers**: 
  - Higher rate limits
  - Priority support
  - Advanced features

## Integration Example

Once you have your API key, I'll create a `socketService.js` file that integrates Socket API into your Bridge feature.

## Alternative: LiFi API

If Socket doesn't work out, **LiFi** is another excellent bridge aggregator:
- Website: https://li.fi/
- API Docs: https://docs.li.fi/
- Similar functionality to Socket

## Next Steps

1. **Sign up** at https://socket.tech/
2. **Get your API key** from the dashboard
3. **Share the API key** with me, and I'll integrate it into your Bridge feature
4. **Test** the integration

## Notes

- Socket API is primarily for **bridge aggregation** (cross-chain transfers)
- It's **optional** - your Bridge feature can work with other bridge services too
- The API key is **safe to expose** in frontend (it's a public API key)
- Consider rate limits when making requests

---

**Ready to integrate?** Once you have your Socket API key, let me know and I'll add it to the Bridge feature!

