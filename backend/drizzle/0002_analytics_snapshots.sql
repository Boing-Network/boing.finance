-- Migration: Add analytics_snapshots table for storing historical analytics data
CREATE TABLE IF NOT EXISTS "analytics_snapshots" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"range" text NOT NULL,
	"network" integer NOT NULL,
	"total_volume" text NOT NULL,
	"total_liquidity" text NOT NULL,
	"total_pools" integer DEFAULT 0,
	"total_transactions" integer DEFAULT 0,
	"market_cap" text,
	"active_cryptocurrencies" integer,
	"markets" integer,
	"snapshot_data" text,
	"timestamp" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_snapshots_range_idx" ON "analytics_snapshots"("range");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_snapshots_network_idx" ON "analytics_snapshots"("network");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_snapshots_timestamp_idx" ON "analytics_snapshots"("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_snapshots_range_network_timestamp_idx" ON "analytics_snapshots"("range","network","timestamp");

