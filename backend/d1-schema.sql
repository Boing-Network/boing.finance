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