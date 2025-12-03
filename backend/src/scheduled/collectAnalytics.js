// Scheduled task to collect analytics data periodically
// This runs as a Cloudflare Workers Cron Trigger

import AnalyticsService from '../services/analyticsService.js';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schema from '../database/schema.js';

export default {
  async scheduled(event, env, ctx) {
    console.log('🔄 Starting scheduled analytics data collection...');
    
    try {
      const analyticsService = new AnalyticsService(env);
      const db = drizzle(env.DB, { schema });
      
      // Supported networks
      const networks = [1, 137, 56, 42161, 10, 8453]; // Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
      
      // Collect data for all time ranges
      const ranges = ['24h', '7d', '30d', '1y'];
      
      let collectedCount = 0;
      let errorCount = 0;
      
      for (const range of ranges) {
        try {
          console.log(`📊 Collecting ${range} analytics data...`);
          
          // Fetch aggregated analytics data
          const data = await analyticsService.getAnalyticsData(range, networks);
          
          if (!data) {
            console.warn(`⚠️ No data returned for ${range}`);
            continue;
          }
          
          // Store snapshot for each network
          for (const network of networks) {
            try {
              const networkName = analyticsService.getNetworkName(network);
              const networkStats = data.networkStats[networkName] || {};
              
              // Prepare snapshot data
              const snapshotData = {
                networkStats: networkStats,
                topPairs: data.topPairs.filter(p => p.network === networkName),
                marketData: data.marketData
              };
              
              // Insert snapshot (D1 doesn't support onConflictDoUpdate, so we just insert)
              // Old snapshots will be cleaned up by the cleanup task
              await db.insert(schema.analyticsSnapshots)
                .values({
                  range,
                  network,
                  totalVolume: data.totalVolume,
                  totalLiquidity: data.totalLiquidity,
                  totalPools: data.totalPools,
                  totalTransactions: data.totalTransactions,
                  marketCap: data.marketData?.total_market_cap?.usd?.toString() || null,
                  activeCryptocurrencies: data.marketData?.active_cryptocurrencies || null,
                  markets: data.marketData?.markets || null,
                  snapshotData: JSON.stringify(snapshotData),
                  timestamp: new Date().toISOString()
                });
              
              collectedCount++;
            } catch (networkError) {
              console.error(`❌ Error storing snapshot for network ${network} (${range}):`, networkError);
              errorCount++;
            }
          }
          
          console.log(`✅ Collected ${range} data for ${networks.length} networks`);
        } catch (rangeError) {
          console.error(`❌ Error collecting ${range} data:`, rangeError);
          errorCount++;
        }
      }
      
      // Clean up old snapshots (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString();
      
      // Delete old snapshots
      await db.execute(
        sql`DELETE FROM analytics_snapshots WHERE datetime(timestamp) < datetime(${cutoffDate})`
      );
      
      console.log(`🧹 Cleaned up old snapshots`);
      console.log(`✅ Collection complete: ${collectedCount} snapshots stored, ${errorCount} errors`);
      
      return {
        success: true,
        collected: collectedCount,
        errors: errorCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Fatal error in scheduled analytics collection:', error);
      throw error;
    }
  }
};

