import { createLocalDB } from './src/database/connection.js';
import { sql } from 'drizzle-orm';
import { tokens, pairs, swaps, liquidityEvents } from './src/database/schema.js';

async function setupDatabase() {
  try {
    console.log('🚀 Setting up DEX database...');
    
    const connection = createLocalDB();
    const { db, execute } = connection;
    
    // Create tables
    console.log('📋 Creating tables...');
    
    await execute(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        chain_id INTEGER NOT NULL,
        total_supply TEXT,
        price_usd REAL,
        volume_24h REAL,
        market_cap REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL UNIQUE,
        token0_address TEXT NOT NULL,
        token1_address TEXT NOT NULL,
        token0_symbol TEXT NOT NULL,
        token1_symbol TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        reserve0 TEXT NOT NULL,
        reserve1 TEXT NOT NULL,
        total_supply TEXT NOT NULL,
        fee_rate REAL DEFAULT 0.003,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS swaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_hash TEXT NOT NULL UNIQUE,
        pair_address TEXT NOT NULL,
        sender TEXT NOT NULL,
        token_in TEXT NOT NULL,
        token_out TEXT NOT NULL,
        amount_in TEXT NOT NULL,
        amount_out TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS liquidity_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_hash TEXT NOT NULL UNIQUE,
        pair_address TEXT NOT NULL,
        provider TEXT NOT NULL,
        action TEXT NOT NULL,
        amount0 TEXT NOT NULL,
        amount1 TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Tables created: tokens, pairs, swaps, liquidity_events');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 