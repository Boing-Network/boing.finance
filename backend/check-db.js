import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'dex.db');
const db = new Database(dbPath);

console.log('🔍 Checking database contents...');

try {
  // Check tokens table
  console.log('\n📊 Tokens:');
  const tokens = db.prepare('SELECT * FROM tokens').all();
  console.log(`Total tokens: ${tokens.length}`);
  tokens.forEach(token => {
    console.log(`- ${token.symbol} (${token.name}) on chain ${token.chain_id}`);
  });

  // Check pairs table
  console.log('\n📊 Pairs:');
  const pairs = db.prepare('SELECT * FROM pairs').all();
  console.log(`Total pairs: ${pairs.length}`);
  pairs.forEach(pair => {
    console.log(`- ${pair.token0_symbol}/${pair.token1_symbol} on chain ${pair.chain_id}`);
  });

  // Check Sepolia specifically
  console.log('\n🧪 Sepolia data:');
  const sepoliaTokens = db.prepare('SELECT * FROM tokens WHERE chain_id = ?').all(11155111);
  const sepoliaPairs = db.prepare('SELECT * FROM pairs WHERE chain_id = ?').all(11155111);
  
  console.log(`Sepolia tokens: ${sepoliaTokens.length}`);
  console.log(`Sepolia pairs: ${sepoliaPairs.length}`);

} catch (error) {
  console.error('❌ Error checking database:', error);
} finally {
  db.close();
} 