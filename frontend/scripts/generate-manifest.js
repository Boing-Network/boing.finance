#!/usr/bin/env node

/**
 * Generate farcaster.json manifest from minikit.config.ts
 * This script ensures the manifest is always in sync with the config
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Generating farcaster.json from minikit.config.ts...');

// Import the config (we'll need to handle TypeScript)
const configPath = path.join(__dirname, '..', 'minikit.config.ts');

try {
  // Read the config file
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Extract the ROOT_URL
  const rootUrlMatch = configContent.match(/const ROOT_URL = process\.env\.REACT_APP_FRONTEND_URL \|\| '([^']+)';/);
  const rootUrl = rootUrlMatch ? rootUrlMatch[1] : 'https://0ce87f2c.boing-finance.pages.dev';
  
  console.log(`📍 Using ROOT_URL: ${rootUrl}`);
  
  // Generate the manifest from the config structure
  const manifest = {
    version: "1",
    name: "Boing Finance",
    subtitle: "Cross-Chain DeFi Platform",
    description: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance - the most user-friendly decentralized exchange for token deployment and cross-chain trading.",
    iconUrl: `${rootUrl}/logo.svg`,
    splashImageUrl: `${rootUrl}/og-image.svg`,
    splashBackgroundColor: "#0a0a0a",
    homeUrl: rootUrl,
    webhookUrl: `${rootUrl}/api/webhook`,
    primaryCategory: "finance",
    tags: ["defi", "dex", "trading", "tokens", "cross-chain", "liquidity", "swap", "bridge"],
    heroImageUrl: `${rootUrl}/og-image.svg`,
    tagline: "The ultimate multi-network DeFi platform",
    ogTitle: "Boing Finance - Cross-Chain DeFi Platform",
    ogDescription: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance.",
    ogImageUrl: `${rootUrl}/og-image.svg`,
    screenshotUrls: [
      `${rootUrl}/screenshot-portrait.png`,
      `${rootUrl}/screenshot-landscape.png`
    ],
    noindex: false,
    baseBuilder: {
      ownerAddress: "0xEa9C8A5c669725A19e1890001d7c553771EE6cFc"
    }
  };
  
  // Write the manifest to the .well-known directory
  const manifestPath = path.join(__dirname, '..', 'public', '.well-known', 'farcaster.json');
  const manifestDir = path.dirname(manifestPath);
  
  // Ensure the directory exists
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  
  // Write the manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Generated farcaster.json successfully');
  console.log(`📁 Location: ${manifestPath}`);
  console.log(`🌐 Manifest URL: ${rootUrl}/.well-known/farcaster.json`);
  
} catch (error) {
  console.error('❌ Error generating manifest:', error.message);
  process.exit(1);
}
