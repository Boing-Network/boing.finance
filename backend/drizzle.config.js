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
  // schemaFilter removed to include all tables including new analytics tables
}); 