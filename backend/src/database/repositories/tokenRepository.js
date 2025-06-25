import { eq, and, desc, sql, like } from 'drizzle-orm';
import { tokens } from '../schema.js';

export class TokenRepository {
  constructor(db) {
    this.db = db;
  }

  // Create a new token
  async create(tokenData) {
    const [token] = await this.db.insert(tokens).values({
      address: tokenData.address,
      chainId: tokenData.chainId,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      totalSupply: tokenData.totalSupply,
      priceUsd: tokenData.priceUsd,
      volume24h: tokenData.volume24h,
      marketCap: tokenData.marketCap,
    }).returning();
    return token;
  }

  // Get token by address
  async findByAddress(address) {
    const token = await this.db.select().from(tokens).where(eq(tokens.address, address)).limit(1);
    return token[0] || null;
  }

  // Get token by ID
  async findById(id) {
    const token = await this.db.select().from(tokens).where(eq(tokens.id, id)).limit(1);
    return token[0] || null;
  }

  // Get all tokens
  async findAll(limit = 100, offset = 0) {
    return await this.db.select().from(tokens).orderBy(desc(tokens.createdAt)).limit(limit).offset(offset);
  }

  // Get tokens by chain ID
  async findByChainId(chainId, limit = 100, offset = 0) {
    return await this.db.select().from(tokens)
      .where(eq(tokens.chainId, chainId))
      .orderBy(desc(tokens.createdAt))
      .limit(limit).offset(offset);
  }

  // Update token
  async update(address, updateData) {
    const result = await this.db.update(tokens)
      .set({
        name: updateData.name,
        symbol: updateData.symbol,
        decimals: updateData.decimals,
        totalSupply: updateData.totalSupply,
        priceUsd: updateData.priceUsd,
        volume24h: updateData.volume24h,
        marketCap: updateData.marketCap,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(tokens.address, address));
    return { changes: result.changes ?? result.count ?? 0 };
  }

  // Update token price
  async updatePrice(address, priceUsd, volume24h, marketCap) {
    const result = await this.db.update(tokens)
      .set({
        priceUsd,
        volume24h,
        marketCap,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(tokens.address, address));
    return { changes: result.changes ?? result.count ?? 0 };
  }

  // Delete token
  async delete(address) {
    const result = await this.db.delete(tokens).where(eq(tokens.address, address));
    return { changes: result.changes ?? result.count ?? 0 };
  }

  // Search tokens
  async search(query, limit = 20) {
    return await this.db.select().from(tokens)
      .where(
        sql`name LIKE ${'%' + query + '%'} OR symbol LIKE ${'%' + query + '%'} OR address LIKE ${'%' + query + '%'}`
      )
      .orderBy(desc(tokens.marketCap), desc(tokens.volume24h))
      .limit(limit);
  }

  // Get token statistics
  async getStats() {
    const [row] = await this.db.select({
      total_tokens: sql`COUNT(*)`,
      tokens_with_price: sql`COUNT(CASE WHEN price_usd IS NOT NULL THEN 1 END)`,
      total_volume_24h: sql`SUM(volume_24h)`,
      total_market_cap: sql`SUM(market_cap)`
    }).from(tokens);
    return row;
  }

  // Get top tokens by market cap
  async getTopByMarketCap(limit = 10) {
    return await this.db.select().from(tokens)
      .where(sql`market_cap IS NOT NULL`)
      .orderBy(desc(tokens.marketCap))
      .limit(limit);
  }

  // Get top tokens by volume
  async getTopByVolume(limit = 10) {
    return await this.db.select().from(tokens)
      .where(sql`volume_24h IS NOT NULL`)
      .orderBy(desc(tokens.volume24h))
      .limit(limit);
  }

  // Get all tokens with pagination
  async getAllTokens(page = 1, limit = 20, chainId = null) {
    const offset = (page - 1) * limit;
    let query = this.db.select().from(tokens);
    
    if (chainId) {
      query = query.where(eq(tokens.chainId, chainId));
    }
    
    const results = await query
      .orderBy(desc(tokens.volume24h))
      .limit(limit)
      .offset(offset);
    
    return results;
  }

  // Get token by address
  async getTokenByAddress(address, chainId = null) {
    let query = this.db.select().from(tokens).where(eq(tokens.address, address));
    
    if (chainId) {
      query = query.where(eq(tokens.chainId, chainId));
    }
    
    const result = await query;
    return result[0] || null;
  }

  // Search tokens by name or symbol
  async searchTokens(searchTerm, chainId = null, limit = 10) {
    let query = this.db.select().from(tokens)
      .where(like(tokens.name, `%${searchTerm}%`))
      .or(like(tokens.symbol, `%${searchTerm}%`));
    
    if (chainId) {
      query = query.where(eq(tokens.chainId, chainId));
    }
    
    const results = await query
      .orderBy(desc(tokens.volume24h))
      .limit(limit);
    
    return results;
  }

  // Get top tokens by volume
  async getTopTokensByVolume(chainId = null, limit = 10) {
    let query = this.db.select().from(tokens);
    
    if (chainId) {
      query = query.where(eq(tokens.chainId, chainId));
    }
    
    const results = await query
      .orderBy(desc(tokens.volume24h))
      .limit(limit);
    
    return results;
  }

  // Get top tokens by market cap
  async getTopTokensByMarketCap(chainId = null, limit = 10) {
    let query = this.db.select().from(tokens);
    
    if (chainId) {
      query = query.where(eq(tokens.chainId, chainId));
    }
    
    const results = await query
      .orderBy(desc(tokens.marketCap))
      .limit(limit);
    
    return results;
  }

  // Get token count
  async getTokenCount(chainId = null) {
    let query = this.db.select({ count: sql`count(*)` }).from(tokens);
    
    if (chainId) {
      query = query.where(eq(tokens.chainId, chainId));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }
} 