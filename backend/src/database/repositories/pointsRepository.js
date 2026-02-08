import { eq, desc, sql } from 'drizzle-orm';
import { userPoints, pointsActivity } from '../schema.js';

export class PointsRepository {
  constructor(db) {
    this.db = db;
  }

  async getPoints(address) {
    const [row] = await this.db.select().from(userPoints).where(eq(userPoints.address, address));
    return row ?? null;
  }

  async getOrCreatePoints(address) {
    let row = await this.getPoints(address);
    if (!row) {
      const [inserted] = await this.db.insert(userPoints).values({ address, points: 0 }).returning();
      row = inserted;
    }
    return row;
  }

  async addPoints(address, points, action, txHash = null, chainId = null, metadata = null) {
    await this.getOrCreatePoints(address);
    const [activity] = await this.db.insert(pointsActivity).values({
      address,
      action,
      points,
      txHash,
      chainId,
      metadata: metadata ? JSON.stringify(metadata) : null
    }).returning();
    await this.db.update(userPoints)
      .set({ points: sql`points + ${points}`, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(userPoints.address, address));
    return activity;
  }

  async getActivityHistory(address, limit = 50, offset = 0) {
    return await this.db.select().from(pointsActivity)
      .where(eq(pointsActivity.address, address))
      .orderBy(desc(pointsActivity.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getActivityHistoryAll(limit = 100, offset = 0) {
    return await this.db.select().from(pointsActivity)
      .orderBy(desc(pointsActivity.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
