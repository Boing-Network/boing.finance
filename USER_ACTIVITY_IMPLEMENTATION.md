# User Activity Analytics Implementation Guide

## Overview

The User Activity section in the Analytics page requires tracking user interactions and storing them in the database. Currently, this feature shows "unavailable" because the backend needs to collect and aggregate user activity data.

## What's Needed

### 1. Database Schema ✅ (Already Exists)

The `user_interactions` table already exists in the database schema:

```sql
CREATE TABLE user_interactions (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'swap', 'liquidity_add', 'liquidity_remove', 'search', 'view'
  token_address TEXT,
  pair_address TEXT,
  chain_id INTEGER,
  amount TEXT,
  tx_hash TEXT,
  metadata TEXT,  -- JSON string
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Frontend Tracking Implementation

You need to track user interactions throughout the app and send them to the backend.

#### Example: Track Swap Actions

In `src/pages/Swap.js`:

```javascript
import { trackUserActivity } from '../services/analyticsService';

// After a successful swap
const handleSwap = async () => {
  try {
    // ... existing swap logic ...
    
    // Track the swap activity
    await trackUserActivity({
      action: 'swap',
      tokenAddress: tokenIn.address,
      pairAddress: pairAddress,
      chainId: chainId,
      amount: amountIn.toString(),
      txHash: txHash,
      metadata: {
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amountOut: amountOut.toString()
      }
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

#### Example: Track Liquidity Actions

In `src/pages/Liquidity.js`:

```javascript
// After adding liquidity
await trackUserActivity({
  action: 'liquidity_add',
  tokenAddress: token0.address,
  pairAddress: pairAddress,
  chainId: chainId,
  amount: amount0.toString(),
  txHash: txHash,
  metadata: {
    token0: token0.symbol,
    token1: token1.symbol,
    amount1: amount1.toString()
  }
});

// After removing liquidity
await trackUserActivity({
  action: 'liquidity_remove',
  tokenAddress: token0.address,
  pairAddress: pairAddress,
  chainId: chainId,
  amount: amount0.toString(),
  txHash: txHash
});
```

#### Example: Track Search Actions

In `src/pages/Tokens.js` or search components:

```javascript
// When user searches for a token
await trackUserActivity({
  action: 'search',
  metadata: {
    query: searchQuery,
    resultCount: searchResults.length
  }
});
```

#### Example: Track Page Views

In `src/pages/Analytics.js`:

```javascript
useEffect(() => {
  trackUserActivity({
    action: 'view',
    metadata: {
      page: 'analytics',
      section: activeSection
    }
  });
}, [activeSection]);
```

### 3. Create Analytics Service Helper

Create `src/services/analyticsService.js` (if it doesn't exist):

```javascript
import config from '../config';
import { useWallet } from '../contexts/WalletContext';

export const trackUserActivity = async (activityData) => {
  try {
    const { account } = useWallet();
    
    const response = await fetch(`${config.apiUrl}/analytics/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: account || 'anonymous',
        ...activityData
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to track user activity');
    }
  } catch (error) {
    // Silently fail - don't interrupt user flow
    console.warn('Error tracking user activity:', error);
  }
};
```

### 4. Backend Endpoint ✅ (Already Exists)

The backend already has the endpoint at `/analytics/interactions`:

```javascript
POST /analytics/interactions
Body: {
  userId: string,
  action: string,
  tokenAddress?: string,
  pairAddress?: string,
  chainId?: number,
  amount?: string,
  txHash?: string,
  metadata?: object
}
```

### 5. Analytics Endpoint Enhancement

Update the `/api/analytics` endpoint to include user activity aggregation:

```javascript
// In backend/src/routes/apiRoutes.js

// Add user activity aggregation
const userActivity = await db.select()
  .from(schema.userInteractions)
  .where(
    sql`datetime(timestamp) >= datetime(${startTime.toISOString()})`
  )
  .orderBy(sql`timestamp DESC`);

// Aggregate by action type
const activityByType = {};
userActivity.forEach(activity => {
  const action = activity.action;
  if (!activityByType[action]) {
    activityByType[action] = 0;
  }
  activityByType[action]++;
});

// Add to analyticsData
analyticsData.userActivity = {
  totalActions: userActivity.length,
  byType: activityByType,
  recentActivity: userActivity.slice(0, 10)
};
```

### 6. Frontend Display Update

Update `src/pages/Analytics.js` to display user activity:

```javascript
{analytics?.userActivity ? (
  <div>
    <h3>Total Actions: {analytics.userActivity.totalActions}</h3>
    <div>
      {Object.entries(analytics.userActivity.byType).map(([action, count]) => (
        <div key={action}>
          {action}: {count}
        </div>
      ))}
    </div>
  </div>
) : (
  <div>User activity data not available</div>
)}
```

## Implementation Steps

1. **Create Analytics Service** (if not exists)
   - Add `trackUserActivity` function
   - Handle user identification (wallet address or session ID)

2. **Add Tracking to Key Actions**
   - Swap transactions
   - Liquidity add/remove
   - Token searches
   - Page views
   - Token deployments

3. **Update Backend Analytics Endpoint**
   - Query `user_interactions` table
   - Aggregate by action type and time range
   - Include in analytics response

4. **Update Frontend Display**
   - Show user activity chart
   - Display activity by type
   - Show recent activity timeline

5. **Test**
   - Perform actions (swap, add liquidity, etc.)
   - Verify data appears in database
   - Check analytics page displays data

## Privacy Considerations

- **User Identification**: Use wallet address when available, session ID for anonymous users
- **Data Retention**: Consider implementing data retention policies (e.g., delete data older than 90 days)
- **GDPR Compliance**: Allow users to opt-out or delete their activity data
- **Anonymization**: Consider anonymizing data for aggregate statistics

## Example Implementation Priority

1. **High Priority** (Most valuable):
   - Swap tracking
   - Liquidity add/remove tracking
   - Page view tracking

2. **Medium Priority**:
   - Search tracking
   - Token deployment tracking
   - Portfolio view tracking

3. **Low Priority**:
   - Button clicks
   - Modal opens/closes
   - Settings changes

## Testing

After implementation:

1. Perform various actions (swap, add liquidity, search)
2. Check database: `SELECT * FROM user_interactions ORDER BY timestamp DESC LIMIT 10;`
3. Check analytics endpoint: `GET /api/analytics?range=24h`
4. Verify data appears in Analytics page

## Current Status

- ✅ Database schema exists
- ✅ Backend endpoint exists (`/analytics/interactions`)
- ❌ Frontend tracking not implemented
- ❌ Backend aggregation not implemented
- ❌ Frontend display not implemented

Once these are implemented, the User Activity section will show real data!

