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
  
    // Generate the manifest from the config structure (matching Farcaster webapp requirements)
    const manifest = {
      frame: {
        name: "boing.finance",
        version: "1",
        iconUrl: "https://boing.finance/icon.png",
        homeUrl: "https://boing.finance/",
        imageUrl: "https://boing.finance/image.png",
        buttonTitle: "Open boing.finance",
        splashImageUrl: "https://boing.finance/splash.png",
        splashBackgroundColor: "#6200EA",
        webhookUrl: "https://boing.finance/api/webhook",
        subtitle: "Deploy tokens, create pools, and trade across chains.",
        description: "The most user-friendly decentralized exchange for token deployment and cross-chain trading. Deploy tokens, create liquidity pools, and trade across multiple blockchains with ease.",
        primaryCategory: "finance",
        heroImageUrl: "https://boing.finance/hero.png",
        screenshotUrls: [
          "https://boing.finance/screenshot-portrait.png"
        ],
        tags: [
          "defi",
          "dex",
          "tokens",
          "cross-chain",
          "liquidity"
        ],
        tagline: "Cross-Chain DeFi Made Easy",
        ogTitle: "boing.finance - DeFi Platform",
        ogDescription: "Deploy tokens, create liquidity pools, and trade across multiple networks with ease.",
        ogImageUrl: "https://boing.finance/hero-image.png",
        castShareUrl: "https://warpcast.com/~/compose?text=🚀+Check+out+Boing+Finance!+Deploy+tokens+and+trade+across+chains+with+ease.+https://boing.finance",
        noindex: false
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
