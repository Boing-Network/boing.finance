const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './src/database/schema.js',
  out: './drizzle',
  dialect: 'better-sqlite',
  dbCredentials: {
    url: './data/dex.db'
  },
  verbose: true,
  strict: true,
  schemaFilter: ['tokens', 'pairs', 'swaps', 'liquidity_events', 'bridge_transactions']
}); 