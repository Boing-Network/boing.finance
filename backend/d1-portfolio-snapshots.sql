-- Portfolio snapshots for PnL tracking (Cloudflare D1)
-- Run: wrangler d1 execute boing-database --file=./d1-portfolio-snapshots.sql
-- For production: wrangler d1 execute boing-database --remote --file=./d1-portfolio-snapshots.sql

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_address TEXT NOT NULL,
  total_value_usd REAL NOT NULL,
  chain_id INTEGER,
  snapshot_data TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS portfolio_snapshots_user_idx ON portfolio_snapshots(user_address);
CREATE INDEX IF NOT EXISTS portfolio_snapshots_timestamp_idx ON portfolio_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS portfolio_snapshots_user_timestamp_idx ON portfolio_snapshots(user_address, timestamp);
