#!/usr/bin/env node

/**
 * Migration script to help set up D1 database
 * This script generates the SQL needed to create tables in D1
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQL to create tables in D1
const d1Schema = `
-- Tokens table
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
);

-- Create indexes for tokens
CREATE INDEX IF NOT EXISTS tokens_address_idx ON tokens(address);
CREATE INDEX IF NOT EXISTS tokens_chain_id_idx ON tokens(chain_id);
CREATE INDEX IF NOT EXISTS tokens_symbol_idx ON tokens(symbol);
CREATE INDEX IF NOT EXISTS tokens_volume_24h_idx ON tokens(volume_24h);
CREATE INDEX IF NOT EXISTS tokens_market_cap_idx ON tokens(market_cap);

-- Pairs table
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
);

-- Create indexes for pairs
CREATE INDEX IF NOT EXISTS pairs_address_idx ON pairs(address);
CREATE INDEX IF NOT EXISTS pairs_chain_id_idx ON pairs(chain_id);
CREATE INDEX IF NOT EXISTS pairs_token0_address_idx ON pairs(token0_address);
CREATE INDEX IF NOT EXISTS pairs_token1_address_idx ON pairs(token1_address);
CREATE INDEX IF NOT EXISTS pairs_tokens_idx ON pairs(token0_address, token1_address);

-- Swaps table
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
);

-- Create indexes for swaps
CREATE INDEX IF NOT EXISTS swaps_tx_hash_idx ON swaps(tx_hash);
CREATE INDEX IF NOT EXISTS swaps_pair_address_idx ON swaps(pair_address);
CREATE INDEX IF NOT EXISTS swaps_sender_idx ON swaps(sender);
CREATE INDEX IF NOT EXISTS swaps_chain_id_idx ON swaps(chain_id);
CREATE INDEX IF NOT EXISTS swaps_timestamp_idx ON swaps(timestamp);
CREATE INDEX IF NOT EXISTS swaps_block_number_idx ON swaps(block_number);

-- Liquidity events table
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
);

-- Create indexes for liquidity events
CREATE INDEX IF NOT EXISTS liquidity_events_tx_hash_idx ON liquidity_events(tx_hash);
CREATE INDEX IF NOT EXISTS liquidity_events_pair_address_idx ON liquidity_events(pair_address);
CREATE INDEX IF NOT EXISTS liquidity_events_provider_idx ON liquidity_events(provider);
CREATE INDEX IF NOT EXISTS liquidity_events_action_idx ON liquidity_events(action);
CREATE INDEX IF NOT EXISTS liquidity_events_chain_id_idx ON liquidity_events(chain_id);
CREATE INDEX IF NOT EXISTS liquidity_events_timestamp_idx ON liquidity_events(timestamp);
`;

// Sample data for testing
const sampleData = `
-- Insert sample tokens
INSERT OR IGNORE INTO tokens (address, name, symbol, decimals, chain_id, total_supply, price_usd, volume_24h, market_cap) VALUES
('0x1234567890123456789012345678901234567890', 'Ethereum', 'ETH', 18, 1, '100000000000000000000000000', 2000.00, 5000000.00, 240000000000.00),
('0x0987654321098765432109876543210987654321', 'USD Coin', 'USDC', 6, 1, '1000000000000', 1.00, 1000000.00, 1000000000.00),
('0xabcdef1234567890abcdef1234567890abcdef12', 'DEX Token', 'DEX', 18, 1, '1000000000000000000000000', 0.50, 100000.00, 500000000.00);

-- Insert sample pairs
INSERT OR IGNORE INTO pairs (address, token0_address, token1_address, token0_symbol, token1_symbol, chain_id, reserve0, reserve1, total_supply, fee_rate) VALUES
('0xpair123456789012345678901234567890123456', '0x1234567890123456789012345678901234567890', '0x0987654321098765432109876543210987654321', 'ETH', 'USDC', 1, '1000000000000000000', '2000000000', '1000000000000000000', 0.003),
('0xpair098765432109876543210987654321098765', '0xabcdef1234567890abcdef1234567890abcdef12', '0x0987654321098765432109876543210987654321', 'DEX', 'USDC', 1, '1000000000000000000000', '500000000', '1000000000000000000', 0.003);
`;

function generateMigrationFiles() {
  const schemaPath = join(__dirname, 'd1-schema.sql');
  const dataPath = join(__dirname, 'd1-sample-data.sql');
  
  // Write schema file
  writeFileSync(schemaPath, d1Schema.trim());
  console.log('✅ Generated D1 schema file: d1-schema.sql');
  
  // Write sample data file
  writeFileSync(dataPath, sampleData.trim());
  console.log('✅ Generated D1 sample data file: d1-sample-data.sql');
  
  console.log('\n📋 Next steps:');
  console.log('1. Create D1 database: wrangler d1 create dex-database');
  console.log('2. Apply schema: wrangler d1 execute dex-database --file=./d1-schema.sql');
  console.log('3. Add sample data: wrangler d1 execute dex-database --file=./d1-sample-data.sql');
  console.log('4. Update wrangler.toml with your database ID');
}

// Run the script
generateMigrationFiles(); 