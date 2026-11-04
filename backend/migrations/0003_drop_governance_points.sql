-- 2026-11-03: governance, treasury and points features were removed from boing.finance; drop their unused tables.
-- Backup taken first: C:\Users\chiku\d1-backups\boing-database-2026-11-03-governance-points.sql
DROP TABLE IF EXISTS governance_votes;
DROP TABLE IF EXISTS governance_proposals;
DROP TABLE IF EXISTS treasury_snapshots;
DROP TABLE IF EXISTS points_activity;
DROP TABLE IF EXISTS user_points;
