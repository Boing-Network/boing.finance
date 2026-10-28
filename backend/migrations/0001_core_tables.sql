-- 0001_core_tables.sql
-- Additive, idempotent schema for the boing.finance D1 database (boing-database).
-- Creates the tables defined in src/database/schema.js that were missing from the
-- remote database (the older d1-migration.sql was never applied there). It only
-- uses CREATE ... IF NOT EXISTS, never drops or alters anything, and inserts no
-- sample data. analytics_events, analytics_snapshots and portfolio_snapshots
-- already exist remotely and are intentionally excluded.
-- Apply: wrangler d1 execute boing-database --remote --file=./migrations/0001_core_tables.sql

CREATE TABLE IF NOT EXISTS `bridge_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL,
	`from_chain` integer NOT NULL,
	`to_chain` integer NOT NULL,
	`user_address` text NOT NULL,
	`token` text NOT NULL,
	`amount` text NOT NULL,
	`status` text NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `contract_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chain_id` integer NOT NULL,
	`contract_name` text NOT NULL,
	`address` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `error_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`error_type` text NOT NULL,
	`error_message` text NOT NULL,
	`stack_trace` text,
	`user_id` text,
	`chain_id` integer,
	`user_agent` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `governance_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chain_id` integer NOT NULL,
	`contract_proposal_id` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`votes_for` text DEFAULT '0',
	`votes_against` text DEFAULT '0',
	`start_block` integer,
	`end_block` integer,
	`end_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `governance_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`voter` text NOT NULL,
	`support` integer NOT NULL,
	`weight` text NOT NULL,
	`tx_hash` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `known_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer NOT NULL,
	`chain_id` integer NOT NULL,
	`total_supply` text,
	`is_verified` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `liquidity_events` (
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
);;

CREATE TABLE IF NOT EXISTS `pairs` (
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
);;

CREATE TABLE IF NOT EXISTS `points_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`action` text NOT NULL,
	`points` integer NOT NULL,
	`tx_hash` text,
	`chain_id` integer,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `search_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`query` text NOT NULL,
	`chain_id` integer,
	`result_count` integer DEFAULT 0,
	`click_count` integer DEFAULT 0,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `solana_deployments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mint_address` text NOT NULL,
	`creator_address` text NOT NULL,
	`network` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`metadata_uri` text,
	`signature` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `swaps` (
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
);;

CREATE TABLE IF NOT EXISTS `treasury_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chain_id` integer NOT NULL,
	`total_usd` text NOT NULL,
	`allocations` text,
	`multisig_signers` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `user_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`token_address` text,
	`pair_address` text,
	`chain_id` integer,
	`amount` text,
	`tx_hash` text,
	`metadata` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `user_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`default_chain_id` integer DEFAULT 1,
	`theme` text DEFAULT 'dark',
	`language` text DEFAULT 'en',
	`notifications` integer DEFAULT 1,
	`slippage_tolerance` real DEFAULT 0.5,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);;

CREATE UNIQUE INDEX IF NOT EXISTS `bridge_transactions_tx_hash_unique` ON `bridge_transactions` (`tx_hash`);;

CREATE INDEX IF NOT EXISTS `bridge_tx_hash_idx` ON `bridge_transactions` (`tx_hash`);;

CREATE INDEX IF NOT EXISTS `bridge_user_idx` ON `bridge_transactions` (`user_address`);;

CREATE INDEX IF NOT EXISTS `bridge_from_chain_idx` ON `bridge_transactions` (`from_chain`);;

CREATE INDEX IF NOT EXISTS `bridge_to_chain_idx` ON `bridge_transactions` (`to_chain`);;

CREATE INDEX IF NOT EXISTS `bridge_status_idx` ON `bridge_transactions` (`status`);;

CREATE INDEX IF NOT EXISTS `bridge_timestamp_idx` ON `bridge_transactions` (`timestamp`);;

CREATE UNIQUE INDEX IF NOT EXISTS `cache_key_unique` ON `cache` (`key`);;

CREATE INDEX IF NOT EXISTS `cache_key_idx` ON `cache` (`key`);;

CREATE INDEX IF NOT EXISTS `cache_expires_at_idx` ON `cache` (`expires_at`);;

CREATE INDEX IF NOT EXISTS `contract_registry_chain_name_idx` ON `contract_registry` (`chain_id`,`contract_name`);;

CREATE INDEX IF NOT EXISTS `error_logs_type_idx` ON `error_logs` (`error_type`);;

CREATE INDEX IF NOT EXISTS `error_logs_user_id_idx` ON `error_logs` (`user_id`);;

CREATE INDEX IF NOT EXISTS `error_logs_timestamp_idx` ON `error_logs` (`timestamp`);;

CREATE INDEX IF NOT EXISTS `gov_proposals_chain_id_idx` ON `governance_proposals` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `gov_proposals_status_idx` ON `governance_proposals` (`status`);;

CREATE INDEX IF NOT EXISTS `gov_proposals_created_at_idx` ON `governance_proposals` (`created_at`);;

CREATE INDEX IF NOT EXISTS `gov_votes_proposal_id_idx` ON `governance_votes` (`proposal_id`);;

CREATE INDEX IF NOT EXISTS `gov_votes_voter_idx` ON `governance_votes` (`voter`);;

CREATE UNIQUE INDEX IF NOT EXISTS `known_tokens_address_unique` ON `known_tokens` (`address`);;

CREATE INDEX IF NOT EXISTS `known_tokens_address_idx` ON `known_tokens` (`address`);;

CREATE INDEX IF NOT EXISTS `known_tokens_chain_id_idx` ON `known_tokens` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `known_tokens_symbol_idx` ON `known_tokens` (`symbol`);;

CREATE UNIQUE INDEX IF NOT EXISTS `liquidity_events_tx_hash_unique` ON `liquidity_events` (`tx_hash`);;

CREATE INDEX IF NOT EXISTS `liquidity_events_tx_hash_idx` ON `liquidity_events` (`tx_hash`);;

CREATE INDEX IF NOT EXISTS `liquidity_events_pair_address_idx` ON `liquidity_events` (`pair_address`);;

CREATE INDEX IF NOT EXISTS `liquidity_events_provider_idx` ON `liquidity_events` (`provider`);;

CREATE INDEX IF NOT EXISTS `liquidity_events_action_idx` ON `liquidity_events` (`action`);;

CREATE INDEX IF NOT EXISTS `liquidity_events_chain_id_idx` ON `liquidity_events` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `liquidity_events_timestamp_idx` ON `liquidity_events` (`timestamp`);;

CREATE UNIQUE INDEX IF NOT EXISTS `pairs_address_unique` ON `pairs` (`address`);;

CREATE INDEX IF NOT EXISTS `pairs_address_idx` ON `pairs` (`address`);;

CREATE INDEX IF NOT EXISTS `pairs_chain_id_idx` ON `pairs` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `pairs_token0_address_idx` ON `pairs` (`token0_address`);;

CREATE INDEX IF NOT EXISTS `pairs_token1_address_idx` ON `pairs` (`token1_address`);;

CREATE INDEX IF NOT EXISTS `points_activity_address_idx` ON `points_activity` (`address`);;

CREATE INDEX IF NOT EXISTS `points_activity_created_at_idx` ON `points_activity` (`created_at`);;

CREATE INDEX IF NOT EXISTS `search_analytics_query_idx` ON `search_analytics` (`query`);;

CREATE INDEX IF NOT EXISTS `search_analytics_chain_id_idx` ON `search_analytics` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `search_analytics_timestamp_idx` ON `search_analytics` (`timestamp`);;

CREATE UNIQUE INDEX IF NOT EXISTS `solana_deployments_mint_address_unique` ON `solana_deployments` (`mint_address`);;

CREATE INDEX IF NOT EXISTS `solana_deployments_mint_idx` ON `solana_deployments` (`mint_address`);;

CREATE INDEX IF NOT EXISTS `solana_deployments_creator_idx` ON `solana_deployments` (`creator_address`);;

CREATE INDEX IF NOT EXISTS `solana_deployments_network_idx` ON `solana_deployments` (`network`);;

CREATE INDEX IF NOT EXISTS `solana_deployments_type_idx` ON `solana_deployments` (`type`);;

CREATE INDEX IF NOT EXISTS `solana_deployments_created_at_idx` ON `solana_deployments` (`created_at`);;

CREATE UNIQUE INDEX IF NOT EXISTS `swaps_tx_hash_unique` ON `swaps` (`tx_hash`);;

CREATE INDEX IF NOT EXISTS `swaps_tx_hash_idx` ON `swaps` (`tx_hash`);;

CREATE INDEX IF NOT EXISTS `swaps_pair_address_idx` ON `swaps` (`pair_address`);;

CREATE INDEX IF NOT EXISTS `swaps_sender_idx` ON `swaps` (`sender`);;

CREATE INDEX IF NOT EXISTS `swaps_chain_id_idx` ON `swaps` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `swaps_timestamp_idx` ON `swaps` (`timestamp`);;

CREATE INDEX IF NOT EXISTS `treasury_chain_id_idx` ON `treasury_snapshots` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `treasury_timestamp_idx` ON `treasury_snapshots` (`timestamp`);;

CREATE INDEX IF NOT EXISTS `user_interactions_user_id_idx` ON `user_interactions` (`user_id`);;

CREATE INDEX IF NOT EXISTS `user_interactions_action_idx` ON `user_interactions` (`action`);;

CREATE INDEX IF NOT EXISTS `user_interactions_chain_id_idx` ON `user_interactions` (`chain_id`);;

CREATE INDEX IF NOT EXISTS `user_interactions_timestamp_idx` ON `user_interactions` (`timestamp`);;

CREATE UNIQUE INDEX IF NOT EXISTS `user_points_address_unique` ON `user_points` (`address`);;

CREATE INDEX IF NOT EXISTS `user_points_address_idx` ON `user_points` (`address`);;

CREATE UNIQUE INDEX IF NOT EXISTS `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);;

CREATE INDEX IF NOT EXISTS `user_preferences_user_id_idx` ON `user_preferences` (`user_id`);
