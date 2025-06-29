import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Applying D1 migration for boing.finance...');

try {
  // Read the migration SQL file
  const migrationPath = join(__dirname, 'd1-migration.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration SQL loaded successfully');
  
  // Apply migration to D1 database
  console.log('🗄️  Applying migration to D1 database...');
  
  // Use wrangler to execute the migration
  const command = `wrangler d1 execute boing-database --file=./d1-migration.sql`;
  
  console.log(`Running: ${command}`);
  const result = execSync(command, { 
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Migration applied successfully!');
  console.log('📊 Database schema updated with:');
  console.log('   - Known tokens table');
  console.log('   - User interactions table');
  console.log('   - Search analytics table');
  console.log('   - User preferences table');
  console.log('   - Analytics events table');
  console.log('   - Cache table');
  console.log('   - Error logs table');
  console.log('   - Legacy tables for backward compatibility');
  console.log('   - Sample data inserted');
  
  // Test the database connection
  console.log('\n🧪 Testing database connection...');
  const testCommand = `wrangler d1 execute boing-database --command="SELECT COUNT(*) as token_count FROM known_tokens"`;
  
  const testResult = execSync(testCommand, { 
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Database connection test successful!');
  console.log(`📈 Found ${testResult.trim()} known tokens in database`);
  
  console.log('\n🎉 D1 migration completed successfully!');
  console.log('🌐 Your D1 database is ready for production use.');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  
  if (error.stderr) {
    console.error('Error details:', error.stderr);
  }
  
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you have wrangler CLI installed: npm install -g wrangler');
  console.log('2. Make sure you are logged in: wrangler login');
  console.log('3. Verify your database ID in wrangler.toml');
  console.log('4. Check that the D1 database exists: wrangler d1 list');
  
  process.exit(1);
} 