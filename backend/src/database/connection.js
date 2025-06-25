import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.js';

// For Cloudflare Workers with D1
export function createD1DB(d1) {
  return drizzle(d1, { schema });
}

// For local development with SQLite
export async function createLocalDB() {
  // Only import better-sqlite3 in Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const { drizzle: drizzleSQLite } = await import('drizzle-orm/better-sqlite3');
    const { default: Database } = await import('better-sqlite3');
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
    
    const sqlite = new Database('./data/dex.db');
    const db = drizzleSQLite(sqlite, { schema });
    
    // Run migrations for local development if migrations exist
    try {
      migrate(db, { migrationsFolder: './drizzle' });
      console.log('✅ Database migrations applied successfully');
    } catch (error) {
      console.log('ℹ️  No migrations to apply or database is fresh');
    }
    
    // Return both Drizzle instance and raw connection for flexibility
    return {
      db,
      sqlite,
      execute: (sql) => sqlite.exec(sql)
    };
  }
  
  throw new Error('Local database is only available in Node.js environment');
}

// Environment-aware database creation
export async function createDB(env = null) {
  // Check if we're in a Cloudflare Workers environment
  if (env && env.DB) {
    return createD1DB(env.DB);
  }
  
  // Fallback to local SQLite for development
  return createLocalDB();
}

// Default export for compatibility
export default { createLocalDB, createD1DB, createDB }; 