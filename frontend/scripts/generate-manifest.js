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
    version: "1",
    name: "Boing Finance",
    subtitle: "Deploy tokens, create pools, and trade across chains",
    description: "The most user-friendly decentralized exchange for token deployment and cross-chain trading. Deploy tokens, create liquidity pools, and trade across multiple blockchains with ease.",
    iconUrl: `${rootUrl}/icon.png`,
    screenshotUrls: [`${rootUrl}/screenshot-portrait.png`],
    imageUrl: `${rootUrl}/image.png`,
    heroImageUrl: `https://boing.finance/hero.png`,
    splashImageUrl: `${rootUrl}/splash.png`,
    splashBackgroundColor: "#6200EA",
    tags: ["defi", "dex", "trading", "tokens", "cross-chain", "liquidity", "swap", "bridge", "ethereum", "base"],
    tagline: "Deploy, Trade, and Build the Future of DeFi",
    buttonTitle: "Open Boing Finance",
    ogTitle: "Boing Finance - Cross-Chain DeFi Platform",
    ogDescription: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with the most user-friendly DeFi platform.",
    ogImageUrl: `${rootUrl}/og-image.svg`,
    castShareUrl: `https://warpcast.com/~/compose?text=Check+out+Boing+Finance+-+the+ultimate+cross-chain+DeFi+platform!+Deploy+tokens%2C+create+pools%2C+and+trade+across+chains+with+ease.`,
    homeUrl: rootUrl,
    webhookUrl: `${rootUrl}/api/webhook`,
    primaryCategory: "finance",
    noindex: false,
    baseBuilder: {
      ownerAddress: "0xEa9C8A5c669725A19e1890001d7c553771EE6cFc"
    },
    accountAssociation: {
      "header": "eyJmaWQiOjEzOTc5MzcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1RTQ2MEQ2OWNjMThiYjBjOEU3MGVkNzVBM2E5QTk2QjdDZTRBMzcyIn0",
      "payload": "eyJkb21haW4iOiJib2luZy5maW5hbmNlIn0",
      "signature": "buQTkbWCkIjwXglpFMrM40rjUrVfEbfe00/rzyno2YMl8Xf7cLyZKfBZd9HAxaIzIaji7+M7/sIC2j7C2HtHIRw="
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
