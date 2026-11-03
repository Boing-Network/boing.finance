-- 0002_drop_solana_deployments.sql
-- Drops the Solana token/NFT deployment log. The Solana deploy pages and the
-- /api/solana/deployments routes were removed in phase A of the Boing-only trim.
-- A JSON backup of the table was taken first (C:\Users\chiku\d1-backups\).
-- Its indexes are dropped with the table.
-- Apply: wrangler d1 execute boing-database --remote --file=./migrations/0002_drop_solana_deployments.sql

DROP TABLE IF EXISTS `solana_deployments`;
