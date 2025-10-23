#!/usr/bin/env node

/**
 * Base MiniApp Setup Script
 * Helps configure Boing Finance for Base App integration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Boing Finance - Base MiniApp Setup');
console.log('=====================================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: Please run this script from the frontend directory');
  process.exit(1);
}

console.log('✅ Found package.json');

// Check if minikit.config.ts exists
const configPath = path.join(__dirname, '..', 'minikit.config.ts');
if (fs.existsSync(configPath)) {
  console.log('✅ Found minikit.config.ts');
} else {
  console.log('❌ minikit.config.ts not found');
}

// Check if manifest exists
const manifestPath = path.join(__dirname, '..', 'public', '.well-known', 'farcaster.json');
if (fs.existsSync(manifestPath)) {
  console.log('✅ Found manifest file');
} else {
  console.log('❌ Manifest file not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Deploy your app to production');
console.log('2. Go to https://base.dev/apps?addApp=true');
console.log('3. Enter your production URL');
console.log('4. Generate account association credentials');
console.log('5. Update minikit.config.ts with credentials');
console.log('6. Redeploy and test at https://base.dev/preview');

console.log('\n🔗 Useful Links:');
console.log('- Base Documentation: https://docs.base.org');
console.log('- Base Build: https://base.dev/apps');
console.log('- Preview Tool: https://base.dev/preview');

console.log('\n✨ Your app is ready for Base App integration!');
