-- Solana deployments - tokens and NFTs created via Boing
CREATE TABLE IF NOT EXISTS solana_deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mint_address TEXT NOT NULL UNIQUE,
  creator_address TEXT NOT NULL,
  network TEXT NOT NULL, -- 'mainnet' | 'devnet'
  type TEXT NOT NULL, -- 'token' | 'nft'
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  metadata_uri TEXT,
  signature TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS solana_deployments_mint_idx ON solana_deployments(mint_address);
CREATE INDEX IF NOT EXISTS solana_deployments_creator_idx ON solana_deployments(creator_address);
CREATE INDEX IF NOT EXISTS solana_deployments_network_idx ON solana_deployments(network);
CREATE INDEX IF NOT EXISTS solana_deployments_type_idx ON solana_deployments(type);
CREATE INDEX IF NOT EXISTS solana_deployments_created_at_idx ON solana_deployments(created_at);
