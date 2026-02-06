import { eq, and, desc, sql, like, gte, lte } from 'drizzle-orm';
import { 
  userInteractions, 
  searchAnalytics, 
  userPreferences, 
  analyticsEvents, 
  cache, 
  errorLogs,
  knownTokens 
} from '../schema.js';

export class AnalyticsRepository {
  constructor(db) {
    this.db = db;
  }

  // User Interactions
  async trackUserInteraction(interactionData) {
    const [interaction] = await this.db.insert(userInteractions).values({
      userId: interactionData.userId,
      action: interactionData.action,
      tokenAddress: interactionData.tokenAddress,
      pairAddress: interactionData.pairAddress,
      chainId: interactionData.chainId,
      amount: interactionData.amount,
      txHash: interactionData.txHash,
      metadata: interactionData.metadata ? JSON.stringify(interactionData.metadata) : null
    }).returning();
    return interaction;
  }

  async getUserInteractions(userId, chainId = null, limit = 50) {
    let query = this.db.select().from(userInteractions).where(eq(userInteractions.userId, userId));
    
    if (chainId) {
      query = query.where(eq(userInteractions.chainId, chainId));
    }
    
    return await query.orderBy(desc(userInteractions.timestamp)).limit(limit);
  }

  async getInteractionStats(userId, timeRange = '24h') {
    const timeFilter = this.getTimeFilter(timeRange);
    
    const stats = await this.db.execute(sql`
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(DISTINCT token_address) as unique_tokens,
        COUNT(DISTINCT pair_address) as unique_pairs
      FROM user_interactions 
      WHERE user_id = ${userId} ${sql.raw(timeFilter)}
      GROUP BY action
      ORDER BY count DESC
    `);
    
    return stats;
  }

  // Search Analytics
  async trackSearchQuery(query, chainId = null, resultCount = 0) {
    const [search] = await this.db.insert(searchAnalytics).values({
      query,
      chainId,
      resultCount
    }).returning();
    return search;
  }

  async incrementSearchClick(query) {
    await this.db.update(searchAnalytics)
      .set({ clickCount: sql`click_count + 1` })
      .where(eq(searchAnalytics.query, query));
  }

  async getPopularSearches(chainId = null, limit = 10) {
    let query = this.db.select().from(searchAnalytics);
    
    if (chainId) {
      query = query.where(eq(searchAnalytics.chainId, chainId));
    }
    
    return await query
      .orderBy(desc(searchAnalytics.clickCount))
      .limit(limit);
  }

  // User Preferences
  async getUserPreferences(userId) {
    const [prefs] = await this.db.select().from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || null;
  }

  async updateUserPreferences(userId, preferences) {
    const [prefs] = await this.db.insert(userPreferences).values({
      userId,
      defaultChainId: preferences.defaultChainId,
      theme: preferences.theme,
      language: preferences.language,
      notifications: preferences.notifications,
      slippageTolerance: preferences.slippageTolerance
    }).onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        defaultChainId: preferences.defaultChainId,
        theme: preferences.theme,
        language: preferences.language,
        notifications: preferences.notifications,
        slippageTolerance: preferences.slippageTolerance,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    }).returning();
    return prefs;
  }

  // Analytics Events
  async trackEvent(eventData) {
    const [event] = await this.db.insert(analyticsEvents).values({
      eventType: eventData.eventType,
      eventName: eventData.eventName,
      userId: eventData.userId,
      sessionId: eventData.sessionId,
      chainId: eventData.chainId,
      metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null
    }).returning();
    return event;
  }

  async getEventStats(eventType, timeRange = '24h') {
    const timeFilter = this.getTimeFilter(timeRange);
    
    const stats = await this.db.execute(sql`
      SELECT 
        event_name,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM analytics_events 
      WHERE event_type = ${eventType} ${sql.raw(timeFilter)}
      GROUP BY event_name
      ORDER BY count DESC
    `);
    
    return stats;
  }

  // Cache Management
  async getCachedData(key) {
    const [cached] = await this.db.select().from(cache)
      .where(eq(cache.key, key));
    
    if (!cached) return null;
    
    // Check if expired
    if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
      await this.db.delete(cache).where(eq(cache.key, key));
      return null;
    }
    
    return JSON.parse(cached.value);
  }

  async setCachedData(key, value, expiresInMinutes = 60) {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    
    await this.db.insert(cache).values({
      key,
      value: JSON.stringify(value),
      expiresAt
    }).onConflictDoUpdate({
      target: cache.key,
      set: {
        value: JSON.stringify(value),
        expiresAt
      }
    });
  }

  async clearExpiredCache() {
    await this.db.delete(cache)
      .where(sql`expires_at < datetime('now')`);
  }

  // Error Logging
  async logError(errorData) {
    const [error] = await this.db.insert(errorLogs).values({
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      stackTrace: errorData.stackTrace,
      userId: errorData.userId,
      chainId: errorData.chainId,
      userAgent: errorData.userAgent
    }).returning();
    return error;
  }

  async getErrorStats(timeRange = '24h') {
    const timeFilter = this.getTimeFilter(timeRange);
    
    const stats = await this.db.execute(sql`
      SELECT 
        error_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as affected_users
      FROM error_logs 
      WHERE 1=1 ${sql.raw(timeFilter)}
      GROUP BY error_type
      ORDER BY count DESC
    `);
    
    return stats;
  }

  // Known Tokens Management
  async addKnownToken(tokenData) {
    const [token] = await this.db.insert(knownTokens).values({
      address: tokenData.address,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      chainId: tokenData.chainId,
      totalSupply: tokenData.totalSupply,
      isVerified: tokenData.isVerified ? 1 : 0
    }).onConflictDoUpdate({
      target: knownTokens.address,
      set: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        totalSupply: tokenData.totalSupply,
        isVerified: tokenData.isVerified ? 1 : 0,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    }).returning();
    return token;
  }

  async getKnownTokens(chainId = null, limit = 100) {
    let query = this.db.select().from(knownTokens);
    
    if (chainId) {
      query = query.where(eq(knownTokens.chainId, chainId));
    }
    
    return await query
      .orderBy(desc(knownTokens.isVerified), desc(knownTokens.createdAt))
      .limit(limit);
  }

  async searchKnownTokens(query, chainId = null, limit = 20) {
    let dbQuery = this.db.select().from(knownTokens)
      .where(like(knownTokens.name, `%${query}%`))
      .or(like(knownTokens.symbol, `%${query}%`))
      .or(like(knownTokens.address, `%${query}%`));
    
    if (chainId) {
      dbQuery = dbQuery.where(eq(knownTokens.chainId, chainId));
    }
    
    return await dbQuery
      .orderBy(desc(knownTokens.isVerified), desc(knownTokens.createdAt))
      .limit(limit);
  }

  // Utility method for time filtering
  getTimeFilter(timeRange) {
    switch (timeRange) {
      case '1h':
        return `AND timestamp > datetime('now', '-1 hour')`;
      case '24h':
        return `AND timestamp > datetime('now', '-1 day')`;
      case '7d':
        return `AND timestamp > datetime('now', '-7 days')`;
      case '30d':
        return `AND timestamp > datetime('now', '-30 days')`;
      case '1y':
        return `AND timestamp > datetime('now', '-365 days')`;
      default:
        return `AND timestamp > datetime('now', '-1 day')`;
    }
  }

  // General Analytics Dashboard
  async getDashboardStats(timeRange = '24h') {
    const timeFilter = this.getTimeFilter(timeRange);
    
    const stats = await this.db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM user_interactions WHERE 1=1 ${sql.raw(timeFilter)}) as total_interactions,
        (SELECT COUNT(DISTINCT user_id) FROM user_interactions WHERE 1=1 ${sql.raw(timeFilter)}) as unique_users,
        (SELECT COUNT(*) FROM search_analytics WHERE 1=1 ${sql.raw(timeFilter)}) as total_searches,
        (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view' ${sql.raw(timeFilter)}) as page_views,
        (SELECT COUNT(*) FROM error_logs WHERE 1=1 ${sql.raw(timeFilter)}) as total_errors
    `);
    
    return stats[0];
  }
} 