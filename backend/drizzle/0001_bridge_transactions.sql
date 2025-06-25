CREATE TABLE `bridge_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL UNIQUE,
	`from_chain` integer NOT NULL,
	`to_chain` integer NOT NULL,
	`user_address` text NOT NULL,
	`token` text NOT NULL,
	`amount` text NOT NULL,
	`status` text NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX `bridge_tx_hash_idx` ON `bridge_transactions` (`tx_hash`);
CREATE INDEX `bridge_user_idx` ON `bridge_transactions` (`user_address`);
CREATE INDEX `bridge_from_chain_idx` ON `bridge_transactions` (`from_chain`);
CREATE INDEX `bridge_to_chain_idx` ON `bridge_transactions` (`to_chain`);
CREATE INDEX `bridge_status_idx` ON `bridge_transactions` (`status`);
CREATE INDEX `bridge_timestamp_idx` ON `bridge_transactions` (`timestamp`); 