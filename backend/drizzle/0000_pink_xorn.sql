CREATE TABLE `tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`chain_id` integer NOT NULL,
	`total_supply` text,
	`price_usd` real,
	`volume_24h` real,
	`market_cap` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pairs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`token0_address` text NOT NULL,
	`token1_address` text NOT NULL,
	`token0_symbol` text NOT NULL,
	`token1_symbol` text NOT NULL,
	`chain_id` integer NOT NULL,
	`reserve0` text NOT NULL,
	`reserve1` text NOT NULL,
	`total_supply` text NOT NULL,
	`fee_rate` real DEFAULT 0.003,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `swaps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL,
	`pair_address` text NOT NULL,
	`sender` text NOT NULL,
	`token_in` text NOT NULL,
	`token_out` text NOT NULL,
	`amount_in` text NOT NULL,
	`amount_out` text NOT NULL,
	`chain_id` integer NOT NULL,
	`block_number` integer NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `liquidity_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL,
	`pair_address` text NOT NULL,
	`provider` text NOT NULL,
	`action` text NOT NULL,
	`amount0` text NOT NULL,
	`amount1` text NOT NULL,
	`chain_id` integer NOT NULL,
	`block_number` integer NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tokens_address_unique` ON `tokens` (`address`);--> statement-breakpoint
CREATE UNIQUE INDEX `pairs_address_unique` ON `pairs` (`address`);--> statement-breakpoint
CREATE UNIQUE INDEX `swaps_tx_hash_unique` ON `swaps` (`tx_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `liquidity_events_tx_hash_unique` ON `liquidity_events` (`tx_hash`);