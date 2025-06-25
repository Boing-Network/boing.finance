CREATE TABLE `bridge_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL,
	`from_chain` integer NOT NULL,
	`to_chain` integer NOT NULL,
	`user_address` text NOT NULL,
	`token` text NOT NULL,
	`amount` text NOT NULL,
	`status` text NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bridge_transactions_tx_hash_unique` ON `bridge_transactions` (`tx_hash`);--> statement-breakpoint
CREATE INDEX `bridge_tx_hash_idx` ON `bridge_transactions` (`tx_hash`);--> statement-breakpoint
CREATE INDEX `bridge_user_idx` ON `bridge_transactions` (`user_address`);--> statement-breakpoint
CREATE INDEX `bridge_from_chain_idx` ON `bridge_transactions` (`from_chain`);--> statement-breakpoint
CREATE INDEX `bridge_to_chain_idx` ON `bridge_transactions` (`to_chain`);--> statement-breakpoint
CREATE INDEX `bridge_status_idx` ON `bridge_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `bridge_timestamp_idx` ON `bridge_transactions` (`timestamp`);--> statement-breakpoint
CREATE INDEX `tokens_address_idx` ON `tokens` (`address`);--> statement-breakpoint
CREATE INDEX `tokens_chain_id_idx` ON `tokens` (`chain_id`);--> statement-breakpoint
CREATE INDEX `tokens_symbol_idx` ON `tokens` (`symbol`);--> statement-breakpoint
CREATE INDEX `tokens_volume_24h_idx` ON `tokens` (`volume_24h`);--> statement-breakpoint
CREATE INDEX `tokens_market_cap_idx` ON `tokens` (`market_cap`);--> statement-breakpoint
CREATE INDEX `pairs_address_idx` ON `pairs` (`address`);--> statement-breakpoint
CREATE INDEX `pairs_chain_id_idx` ON `pairs` (`chain_id`);--> statement-breakpoint
CREATE INDEX `pairs_token0_address_idx` ON `pairs` (`token0_address`);--> statement-breakpoint
CREATE INDEX `pairs_token1_address_idx` ON `pairs` (`token1_address`);--> statement-breakpoint
CREATE INDEX `pairs_tokens_idx` ON `pairs` (`token0_address`,`token1_address`);--> statement-breakpoint
CREATE INDEX `swaps_tx_hash_idx` ON `swaps` (`tx_hash`);--> statement-breakpoint
CREATE INDEX `swaps_pair_address_idx` ON `swaps` (`pair_address`);--> statement-breakpoint
CREATE INDEX `swaps_sender_idx` ON `swaps` (`sender`);--> statement-breakpoint
CREATE INDEX `swaps_chain_id_idx` ON `swaps` (`chain_id`);--> statement-breakpoint
CREATE INDEX `swaps_timestamp_idx` ON `swaps` (`timestamp`);--> statement-breakpoint
CREATE INDEX `swaps_block_number_idx` ON `swaps` (`block_number`);--> statement-breakpoint
CREATE INDEX `liquidity_events_tx_hash_idx` ON `liquidity_events` (`tx_hash`);--> statement-breakpoint
CREATE INDEX `liquidity_events_pair_address_idx` ON `liquidity_events` (`pair_address`);--> statement-breakpoint
CREATE INDEX `liquidity_events_provider_idx` ON `liquidity_events` (`provider`);--> statement-breakpoint
CREATE INDEX `liquidity_events_action_idx` ON `liquidity_events` (`action`);--> statement-breakpoint
CREATE INDEX `liquidity_events_chain_id_idx` ON `liquidity_events` (`chain_id`);--> statement-breakpoint
CREATE INDEX `liquidity_events_timestamp_idx` ON `liquidity_events` (`timestamp`);