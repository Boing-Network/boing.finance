-- D1 Database Migration for boing.finance
-- This file sets up the database schema for analytics and user interactions

-- Known tokens table - stores metadata for tokens we know about
CREATE TABLE IF NOT EXISTS known_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL,
  chain_id INTEGER NOT NULL,
  total_supply TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User interactions table - tracks user actions for analytics
CREATE TABLE IF NOT EXISTS user_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  token_address TEXT,
  pair_address TEXT,
  chain_id INTEGER,
  amount TEXT,
  tx_hash TEXT,
  metadata TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Search analytics table - tracks search queries for insights
CREATE TABLE IF NOT EXISTS search_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  chain_id INTEGER,
  result_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table - stores user settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  default_chain_id INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  notifications INTEGER DEFAULT 1,
  slippage_tolerance REAL DEFAULT 0.5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table - general analytics tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  chain_id INTEGER,
  metadata TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Cache table - for storing frequently accessed data
CREATE TABLE IF NOT EXISTS cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Error logs table - for tracking application errors
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id TEXT,
  chain_id INTEGER,
  user_agent TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Legacy tables for backward compatibility
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

CREATE TABLE IF NOT EXISTS bridge_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_hash TEXT NOT NULL UNIQUE,
  from_chain INTEGER NOT NULL,
  to_chain INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  token TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS known_tokens_address_idx ON known_tokens(address);
CREATE INDEX IF NOT EXISTS known_tokens_chain_id_idx ON known_tokens(chain_id);
CREATE INDEX IF NOT EXISTS known_tokens_symbol_idx ON known_tokens(symbol);

CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_interactions_action_idx ON user_interactions(action);
CREATE INDEX IF NOT EXISTS user_interactions_chain_id_idx ON user_interactions(chain_id);
CREATE INDEX IF NOT EXISTS user_interactions_timestamp_idx ON user_interactions(timestamp);

CREATE INDEX IF NOT EXISTS search_analytics_query_idx ON search_analytics(query);
CREATE INDEX IF NOT EXISTS search_analytics_chain_id_idx ON search_analytics(chain_id);
CREATE INDEX IF NOT EXISTS search_analytics_timestamp_idx ON search_analytics(timestamp);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_timestamp_idx ON analytics_events(timestamp);

CREATE INDEX IF NOT EXISTS cache_key_idx ON cache(key);
CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache(expires_at);

CREATE INDEX IF NOT EXISTS error_logs_type_idx ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS error_logs_user_id_idx ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS error_logs_timestamp_idx ON error_logs(timestamp);

-- Legacy indexes
CREATE INDEX IF NOT EXISTS tokens_address_idx ON tokens(address);
CREATE INDEX IF NOT EXISTS tokens_chain_id_idx ON tokens(chain_id);
CREATE INDEX IF NOT EXISTS tokens_symbol_idx ON tokens(symbol);

CREATE INDEX IF NOT EXISTS pairs_address_idx ON pairs(address);
CREATE INDEX IF NOT EXISTS pairs_chain_id_idx ON pairs(chain_id);
CREATE INDEX IF NOT EXISTS pairs_token0_address_idx ON pairs(token0_address);
CREATE INDEX IF NOT EXISTS pairs_token1_address_idx ON pairs(token1_address);

CREATE INDEX IF NOT EXISTS swaps_tx_hash_idx ON swaps(tx_hash);
CREATE INDEX IF NOT EXISTS swaps_pair_address_idx ON swaps(pair_address);
CREATE INDEX IF NOT EXISTS swaps_sender_idx ON swaps(sender);
CREATE INDEX IF NOT EXISTS swaps_chain_id_idx ON swaps(chain_id);
CREATE INDEX IF NOT EXISTS swaps_timestamp_idx ON swaps(timestamp);

CREATE INDEX IF NOT EXISTS liquidity_events_tx_hash_idx ON liquidity_events(tx_hash);
CREATE INDEX IF NOT EXISTS liquidity_events_pair_address_idx ON liquidity_events(pair_address);
CREATE INDEX IF NOT EXISTS liquidity_events_provider_idx ON liquidity_events(provider);
CREATE INDEX IF NOT EXISTS liquidity_events_action_idx ON liquidity_events(action);
CREATE INDEX IF NOT EXISTS liquidity_events_chain_id_idx ON liquidity_events(chain_id);
CREATE INDEX IF NOT EXISTS liquidity_events_timestamp_idx ON liquidity_events(timestamp);

CREATE INDEX IF NOT EXISTS bridge_tx_hash_idx ON bridge_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS bridge_user_idx ON bridge_transactions(user_address);
CREATE INDEX IF NOT EXISTS bridge_from_chain_idx ON bridge_transactions(from_chain);
CREATE INDEX IF NOT EXISTS bridge_to_chain_idx ON bridge_transactions(to_chain);
CREATE INDEX IF NOT EXISTS bridge_status_idx ON bridge_transactions(status);
CREATE INDEX IF NOT EXISTS bridge_timestamp_idx ON bridge_transactions(timestamp);

-- Insert some sample known tokens
INSERT OR IGNORE INTO known_tokens (address, name, symbol, decimals, chain_id, total_supply, is_verified) VALUES
('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', 'Sepolia Ether', 'ETH', 18, 11155111, '100000000000000000000000000', 1),
('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 'Sepolia USD Coin', 'USDC', 6, 11155111, '1000000000000', 1),
('0x779877A7B0D9E8603169DdbD7836e478b4624789', 'Sepolia Link', 'LINK', 18, 11155111, '1000000000000000000000000', 1),
('0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef', 'Sepolia DEX Token', 'DEX', 18, 11155111, '1000000000000000000000000', 1),
('0x2830729B17469011eC3fCc11125347D960146e76', 'Pugs On The Block', 'POTB', 18, 11155111, '1000000000000000000000000000', 0),
('0xBc0B125D0BDebd6e2d72a523dE7799DD5A5aC911', 'Pugs On The Block', 'POTB', 18, 11155111, '1000000000000000000000000000', 0),
('0x0ED5596A4ecB694F48A0B0D4b44E04D455182780', 'Pugs On The Block', 'POTB', 18, 11155111, '1000000000000000000000000000', 0);

-- Insert some sample user preferences
INSERT OR IGNORE INTO user_preferences (user_id, default_chain_id, theme, language, notifications, slippage_tolerance) VALUES
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 11155111, 'dark', 'en', 1, 0.5),
('0x1234567890123456789012345678901234567890', 1, 'light', 'en', 1, 1.0);

-- Insert some sample analytics events
INSERT OR IGNORE INTO analytics_events (event_type, event_name, user_id, chain_id) VALUES
('page_view', 'home', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 11155111),
('button_click', 'connect_wallet', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 11155111),
('page_view', 'swap', '0x1234567890123456789012345678901234567890', 1);

-- Insert some sample search analytics
INSERT OR IGNORE INTO search_analytics (query, chain_id, result_count, click_count) VALUES
('ETH', 11155111, 5, 12),
('USDC', 11155111, 3, 8),
('LINK', 11155111, 2, 5),
('POTB', 11155111, 3, 15);

-- Insert some sample cache data
INSERT OR IGNORE INTO cache (key, value, expires_at) VALUES
('popular_tokens_11155111', '["ETH","USDC","LINK","POTB"]', datetime('now', '+1 hour')),
('gas_prices_11155111', '{"slow":15,"standard":20,"fast":25}', datetime('now', '+5 minutes'));

-- Insert some sample user interactions
INSERT OR IGNORE INTO user_interactions (user_id, action, token_address, chain_id, amount) VALUES
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'view', '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', 11155111, NULL),
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'search', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 11155111, NULL),
('0x1234567890123456789012345678901234567890', 'swap', '0x779877A7B0D9E8603169DdbD7836e478b4624789', 1, '1000000000000000000');

-- Governance & BOING tables (backend integration foundation)
CREATE TABLE IF NOT EXISTS governance_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id INTEGER NOT NULL,
  contract_proposal_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  votes_for TEXT DEFAULT '0',
  votes_against TEXT DEFAULT '0',
  start_block INTEGER,
  end_block INTEGER,
  end_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS gov_proposals_chain_id_idx ON governance_proposals(chain_id);
CREATE INDEX IF NOT EXISTS gov_proposals_status_idx ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS gov_proposals_created_at_idx ON governance_proposals(created_at);

CREATE TABLE IF NOT EXISTS governance_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  voter TEXT NOT NULL,
  support INTEGER NOT NULL,
  weight TEXT NOT NULL,
  tx_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS gov_votes_proposal_id_idx ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS gov_votes_voter_idx ON governance_votes(voter);

CREATE TABLE IF NOT EXISTS treasury_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id INTEGER NOT NULL,
  total_usd TEXT NOT NULL,
  allocations TEXT,
  multisig_signers TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS treasury_chain_id_idx ON treasury_snapshots(chain_id);
CREATE INDEX IF NOT EXISTS treasury_timestamp_idx ON treasury_snapshots(timestamp);

CREATE TABLE IF NOT EXISTS user_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS user_points_address_idx ON user_points(address);

CREATE TABLE IF NOT EXISTS points_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  tx_hash TEXT,
  chain_id INTEGER,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS points_activity_address_idx ON points_activity(address);
CREATE INDEX IF NOT EXISTS points_activity_created_at_idx ON points_activity(created_at);

CREATE TABLE IF NOT EXISTS contract_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id INTEGER NOT NULL,
  contract_name TEXT NOT NULL,
  address TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS contract_registry_chain_name_idx ON contract_registry(chain_id, contract_name); 