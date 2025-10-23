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
    accountAssociation: {
      header: "eyJmaWQiOjEzOTc5MzcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1RTQ2MEQ2OWNjMThiYjBjOEU3MGVkNzVBM2E5QTk2QjdDZTRBMzcyIn0",
      payload: "eyJkb21haW4iOiJib2luZy5maW5hbmNlIn0",
      signature: "buQTkbWCkIjwXglpFMrM40rjUrVfEbfe00/rzyno2YMl8Xf7cLyZKfBZd9HAxaIzIaji7+M7/sIC2j7C2HtHIRw="
    },
    miniapp: {
      version: "1",
      name: "boing.finance",
      iconUrl: "https://boing.finance/icon.png",
      splashImageUrl: "https://boing.finance/splash.png",
      splashBackgroundColor: "#6200EA",
      homeUrl: "https://boing.finance/",
      webhookUrl: "https://boing.finance/api/webhook",
      subtitle: "Deploy tokens, create pools, and trade across chains.",
      description: "The most user-friendly decentralized exchange for token deployment and cross-chain trading. Deploy tokens, create liquidity pools, and trade across multiple blockchains with ease.",
      screenshotUrls: [
        "https://boing.finance/screenshot-portrait.png"
      ],
      primaryCategory: "finance",
      tags: [
        "defi",
        "dex",
        "tokens",
        "cross-chain",
        "liquidity"
      ],
      heroImageUrl: "https://boing.finance/hero.png",
      tagline: "Cross-Chain DeFi Made Easy",
      ogTitle: "boing.finance - DeFi Platform",
      ogDescription: "Deploy tokens, create liquidity pools, and trade across multiple networks with ease.",
      ogImageUrl: "https://boing.finance/hero-image.png"
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
