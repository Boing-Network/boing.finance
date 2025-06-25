import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tokens table
export const tokens = sqliteTable('tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull().unique(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  decimals: integer('decimals').notNull(),
  chainId: integer('chain_id').notNull(),
  totalSupply: text('total_supply'),
  priceUsd: real('price_usd'),
  volume24h: real('volume_24h'),
  marketCap: real('market_cap'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  // Indexes for better query performance
  addressIdx: index('tokens_address_idx').on(table.address),
  chainIdIdx: index('tokens_chain_id_idx').on(table.chainId),
  symbolIdx: index('tokens_symbol_idx').on(table.symbol),
  volumeIdx: index('tokens_volume_24h_idx').on(table.volume24h),
  marketCapIdx: index('tokens_market_cap_idx').on(table.marketCap)
}));

// Pairs table
export const pairs = sqliteTable('pairs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull().unique(),
  token0Address: text('token0_address').notNull(),
  token1Address: text('token1_address').notNull(),
  token0Symbol: text('token0_symbol').notNull(),
  token1Symbol: text('token1_symbol').notNull(),
  chainId: integer('chain_id').notNull(),
  reserve0: text('reserve0').notNull(),
  reserve1: text('reserve1').notNull(),
  totalSupply: text('total_supply').notNull(),
  feeRate: real('fee_rate').default(0.003),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  // Indexes for better query performance
  addressIdx: index('pairs_address_idx').on(table.address),
  chainIdIdx: index('pairs_chain_id_idx').on(table.chainId),
  token0Idx: index('pairs_token0_address_idx').on(table.token0Address),
  token1Idx: index('pairs_token1_address_idx').on(table.token1Address),
  tokensIdx: index('pairs_tokens_idx').on(table.token0Address, table.token1Address)
}));

// Swaps table
export const swaps = sqliteTable('swaps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  txHash: text('tx_hash').notNull().unique(),
  pairAddress: text('pair_address').notNull(),
  sender: text('sender').notNull(),
  tokenIn: text('token_in').notNull(),
  tokenOut: text('token_out').notNull(),
  amountIn: text('amount_in').notNull(),
  amountOut: text('amount_out').notNull(),
  chainId: integer('chain_id').notNull(),
  blockNumber: integer('block_number').notNull(),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  // Indexes for better query performance
  txHashIdx: index('swaps_tx_hash_idx').on(table.txHash),
  pairAddressIdx: index('swaps_pair_address_idx').on(table.pairAddress),
  senderIdx: index('swaps_sender_idx').on(table.sender),
  chainIdIdx: index('swaps_chain_id_idx').on(table.chainId),
  timestampIdx: index('swaps_timestamp_idx').on(table.timestamp),
  blockNumberIdx: index('swaps_block_number_idx').on(table.blockNumber)
}));

// Liquidity events table
export const liquidityEvents = sqliteTable('liquidity_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  txHash: text('tx_hash').notNull().unique(),
  pairAddress: text('pair_address').notNull(),
  provider: text('provider').notNull(),
  action: text('action').notNull(), // 'add' or 'remove'
  amount0: text('amount0').notNull(),
  amount1: text('amount1').notNull(),
  chainId: integer('chain_id').notNull(),
  blockNumber: integer('block_number').notNull(),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  // Indexes for better query performance
  txHashIdx: index('liquidity_events_tx_hash_idx').on(table.txHash),
  pairAddressIdx: index('liquidity_events_pair_address_idx').on(table.pairAddress),
  providerIdx: index('liquidity_events_provider_idx').on(table.provider),
  actionIdx: index('liquidity_events_action_idx').on(table.action),
  chainIdIdx: index('liquidity_events_chain_id_idx').on(table.chainId),
  timestampIdx: index('liquidity_events_timestamp_idx').on(table.timestamp)
}));

// Bridge transactions table
export const bridgeTransactions = sqliteTable('bridge_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  txHash: text('tx_hash').notNull().unique(),
  fromChain: integer('from_chain').notNull(),
  toChain: integer('to_chain').notNull(),
  userAddress: text('user_address').notNull(),
  token: text('token').notNull(),
  amount: text('amount').notNull(),
  status: text('status').notNull(), // e.g., 'pending', 'completed', 'failed'
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  txHashIdx: index('bridge_tx_hash_idx').on(table.txHash),
  userIdx: index('bridge_user_idx').on(table.userAddress),
  fromChainIdx: index('bridge_from_chain_idx').on(table.fromChain),
  toChainIdx: index('bridge_to_chain_idx').on(table.toChain),
  statusIdx: index('bridge_status_idx').on(table.status),
  timestampIdx: index('bridge_timestamp_idx').on(table.timestamp)
}));

export const schema = {
  tokens,
  pairs,
  swaps,
  liquidityEvents,
  bridgeTransactions
}; 