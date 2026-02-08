import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Known tokens table - stores metadata for tokens we know about
export const knownTokens = sqliteTable('known_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull().unique(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  decimals: integer('decimals').notNull(),
  chainId: integer('chain_id').notNull(),
  totalSupply: text('total_supply'),
  isVerified: integer('is_verified').default(0), // 0 = false, 1 = true
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  addressIdx: index('known_tokens_address_idx').on(table.address),
  chainIdIdx: index('known_tokens_chain_id_idx').on(table.chainId),
  symbolIdx: index('known_tokens_symbol_idx').on(table.symbol)
}));

// User interactions table - tracks user actions for analytics
export const userInteractions = sqliteTable('user_interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(), // Wallet address or session ID
  action: text('action').notNull(), // 'swap', 'liquidity_add', 'liquidity_remove', 'search', 'view'
  tokenAddress: text('token_address'),
  pairAddress: text('pair_address'),
  chainId: integer('chain_id'),
  amount: text('amount'),
  txHash: text('tx_hash'),
  metadata: text('metadata'), // JSON string for additional data
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('user_interactions_user_id_idx').on(table.userId),
  actionIdx: index('user_interactions_action_idx').on(table.action),
  chainIdIdx: index('user_interactions_chain_id_idx').on(table.chainId),
  timestampIdx: index('user_interactions_timestamp_idx').on(table.timestamp)
}));

// Search analytics table - tracks search queries for insights
export const searchAnalytics = sqliteTable('search_analytics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  query: text('query').notNull(),
  chainId: integer('chain_id'),
  resultCount: integer('result_count').default(0),
  clickCount: integer('click_count').default(0),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  queryIdx: index('search_analytics_query_idx').on(table.query),
  chainIdIdx: index('search_analytics_chain_id_idx').on(table.chainId),
  timestampIdx: index('search_analytics_timestamp_idx').on(table.timestamp)
}));

// User preferences table - stores user settings and preferences
export const userPreferences = sqliteTable('user_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  defaultChainId: integer('default_chain_id').default(1),
  theme: text('theme').default('dark'),
  language: text('language').default('en'),
  notifications: integer('notifications').default(1), // 0 = disabled, 1 = enabled
  slippageTolerance: real('slippage_tolerance').default(0.5),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index('user_preferences_user_id_idx').on(table.userId)
}));

// Analytics events table - general analytics tracking
export const analyticsEvents = sqliteTable('analytics_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(), // 'page_view', 'button_click', 'error', etc.
  eventName: text('event_name').notNull(),
  userId: text('user_id'),
  sessionId: text('session_id'),
  chainId: integer('chain_id'),
  metadata: text('metadata'), // JSON string for additional data
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  eventTypeIdx: index('analytics_events_type_idx').on(table.eventType),
  eventNameIdx: index('analytics_events_name_idx').on(table.eventName),
  userIdIdx: index('analytics_events_user_id_idx').on(table.userId),
  timestampIdx: index('analytics_events_timestamp_idx').on(table.timestamp)
}));

// Cache table - for storing frequently accessed data
export const cache = sqliteTable('cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  keyIdx: index('cache_key_idx').on(table.key),
  expiresAtIdx: index('cache_expires_at_idx').on(table.expiresAt)
}));

// Error logs table - for tracking application errors
export const errorLogs = sqliteTable('error_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  errorType: text('error_type').notNull(),
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),
  userId: text('user_id'),
  chainId: integer('chain_id'),
  userAgent: text('user_agent'),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  errorTypeIdx: index('error_logs_type_idx').on(table.errorType),
  userIdIdx: index('error_logs_user_id_idx').on(table.userId),
  timestampIdx: index('error_logs_timestamp_idx').on(table.timestamp)
}));

// Legacy tables for backward compatibility (keeping the old structure)
export const tokens = knownTokens;
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
  addressIdx: index('pairs_address_idx').on(table.address),
  chainIdIdx: index('pairs_chain_id_idx').on(table.chainId),
  token0Idx: index('pairs_token0_address_idx').on(table.token0Address),
  token1Idx: index('pairs_token1_address_idx').on(table.token1Address)
}));

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
  txHashIdx: index('swaps_tx_hash_idx').on(table.txHash),
  pairAddressIdx: index('swaps_pair_address_idx').on(table.pairAddress),
  senderIdx: index('swaps_sender_idx').on(table.sender),
  chainIdIdx: index('swaps_chain_id_idx').on(table.chainId),
  timestampIdx: index('swaps_timestamp_idx').on(table.timestamp)
}));

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
  txHashIdx: index('liquidity_events_tx_hash_idx').on(table.txHash),
  pairAddressIdx: index('liquidity_events_pair_address_idx').on(table.pairAddress),
  providerIdx: index('liquidity_events_provider_idx').on(table.provider),
  actionIdx: index('liquidity_events_action_idx').on(table.action),
  chainIdIdx: index('liquidity_events_chain_id_idx').on(table.chainId),
  timestampIdx: index('liquidity_events_timestamp_idx').on(table.timestamp)
}));

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

// Historical analytics snapshots - stores time-series data for analytics
export const analyticsSnapshots = sqliteTable('analytics_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  range: text('range').notNull(), // '24h', '7d', '30d', '1y'
  network: integer('network').notNull(), // Chain ID
  totalVolume: text('total_volume').notNull(),
  totalLiquidity: text('total_liquidity').notNull(),
  totalPools: integer('total_pools').default(0),
  totalTransactions: integer('total_transactions').default(0),
  marketCap: text('market_cap'),
  activeCryptocurrencies: integer('active_cryptocurrencies'),
  markets: integer('markets'),
  snapshotData: text('snapshot_data'), // JSON string for additional data
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  rangeIdx: index('analytics_snapshots_range_idx').on(table.range),
  networkIdx: index('analytics_snapshots_network_idx').on(table.network),
  timestampIdx: index('analytics_snapshots_timestamp_idx').on(table.timestamp),
  rangeNetworkTimestampIdx: index('analytics_snapshots_range_network_timestamp_idx').on(table.range, table.network, table.timestamp)
}));

// Governance: proposals (metadata + optional on-chain proposal id)
export const governanceProposals = sqliteTable('governance_proposals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chainId: integer('chain_id').notNull(),
  contractProposalId: text('contract_proposal_id'), // on-chain proposal id when contract deployed
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(), // 'active' | 'passed' | 'rejected' | 'pending'
  createdBy: text('created_by').notNull(),
  votesFor: text('votes_for').default('0'),
  votesAgainst: text('votes_against').default('0'),
  startBlock: integer('start_block'),
  endBlock: integer('end_block'),
  endDate: text('end_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  chainIdIdx: index('gov_proposals_chain_id_idx').on(table.chainId),
  statusIdx: index('gov_proposals_status_idx').on(table.status),
  createdAtIdx: index('gov_proposals_created_at_idx').on(table.createdAt)
}));

// Governance: votes (per user per proposal)
export const governanceVotes = sqliteTable('governance_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  proposalId: integer('proposal_id').notNull(),
  voter: text('voter').notNull(),
  support: integer('support').notNull(), // 1 = for, 0 = against
  weight: text('weight').notNull(),
  txHash: text('tx_hash'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  proposalIdIdx: index('gov_votes_proposal_id_idx').on(table.proposalId),
  voterIdx: index('gov_votes_voter_idx').on(table.voter)
}));

// Treasury: snapshots (balance/allocations per chain, when no contract or cached from contract)
export const treasurySnapshots = sqliteTable('treasury_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chainId: integer('chain_id').notNull(),
  totalUsd: text('total_usd').notNull(),
  allocations: text('allocations'), // JSON
  multisigSigners: text('multisig_signers'), // e.g. "3/5"
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  chainIdIdx: index('treasury_chain_id_idx').on(table.chainId),
  timestampIdx: index('treasury_timestamp_idx').on(table.timestamp)
}));

// BOING Points: user total (off-chain accrual until claim contract exists)
export const userPoints = sqliteTable('user_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull().unique(),
  points: integer('points').notNull().default(0),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  addressIdx: index('user_points_address_idx').on(table.address)
}));

// BOING Points: activity log (for history and audit)
export const pointsActivity = sqliteTable('points_activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  address: text('address').notNull(),
  action: text('action').notNull(), // 'swap', 'liquidity_add', 'bridge', 'deploy', 'vote'
  points: integer('points').notNull(),
  txHash: text('tx_hash'),
  chainId: integer('chain_id'),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  addressIdx: index('points_activity_address_idx').on(table.address),
  createdAtIdx: index('points_activity_created_at_idx').on(table.createdAt)
}));

// Contract registry: deployed contract addresses per chain (for frontend/backend to read)
export const contractRegistry = sqliteTable('contract_registry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chainId: integer('chain_id').notNull(),
  contractName: text('contract_name').notNull(), // 'governor', 'treasury', 'boingToken', 'nftStaking'
  address: text('address').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  chainNameIdx: index('contract_registry_chain_name_idx').on(table.chainId, table.contractName)
}));

// Solana deployments - tokens and NFTs (D1)
export const solanaDeployments = sqliteTable('solana_deployments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mintAddress: text('mint_address').notNull().unique(),
  creatorAddress: text('creator_address').notNull(),
  network: text('network').notNull(), // 'mainnet' | 'devnet'
  type: text('type').notNull(), // 'token' | 'nft'
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  metadataUri: text('metadata_uri'),
  signature: text('signature').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  mintIdx: index('solana_deployments_mint_idx').on(table.mintAddress),
  creatorIdx: index('solana_deployments_creator_idx').on(table.creatorAddress),
  networkIdx: index('solana_deployments_network_idx').on(table.network),
  typeIdx: index('solana_deployments_type_idx').on(table.type),
  createdAtIdx: index('solana_deployments_created_at_idx').on(table.createdAt),
}));

// Portfolio snapshots for PnL tracking (D1)
export const portfolioSnapshots = sqliteTable('portfolio_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userAddress: text('user_address').notNull(),
  totalValueUsd: real('total_value_usd').notNull(),
  chainId: integer('chain_id'),
  snapshotData: text('snapshot_data'),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdx: index('portfolio_snapshots_user_idx').on(table.userAddress),
  timestampIdx: index('portfolio_snapshots_timestamp_idx').on(table.timestamp),
  userTimestampIdx: index('portfolio_snapshots_user_timestamp_idx').on(table.userAddress, table.timestamp)
}));

export const schema = {
  solanaDeployments,
  // Governance & BOING
  governanceProposals,
  governanceVotes,
  treasurySnapshots,
  userPoints,
  pointsActivity,
  contractRegistry,
  // New D1-optimized tables
  knownTokens,
  portfolioSnapshots,
  userInteractions,
  searchAnalytics,
  userPreferences,
  analyticsEvents,
  cache,
  errorLogs,
  analyticsSnapshots,
  
  // Legacy tables for backward compatibility
  tokens,
  pairs,
  swaps,
  liquidityEvents,
  bridgeTransactions
}; 