// Script to update service worker cache version on each build
// This ensures cache invalidation on each deployment

const fs = require('fs');
const path = require('path');

const serviceWorkerPath = path.join(__dirname, '../public/service-worker.js');

try {
  let content = fs.readFileSync(serviceWorkerPath, 'utf8');
  
  // Generate a new version based on timestamp
  const newVersion = 'v' + Date.now();
  
  // Update the CACHE_VERSION constant
  content = content.replace(
    /const CACHE_VERSION = ['"]v\d+['"];?/,
    `const CACHE_VERSION = '${newVersion}';`
  );
  
  fs.writeFileSync(serviceWorkerPath, content, 'utf8');
  console.log(`✅ Updated service worker cache version to: ${newVersion}`);
} catch (error) {
  console.error('❌ Failed to update service worker version:', error);
  process.exit(1);
}

