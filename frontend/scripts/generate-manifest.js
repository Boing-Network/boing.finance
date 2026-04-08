#!/usr/bin/env node

/**
 * Generate public/.well-known/farcaster.json from minikit.config.ts
 * Parses string fields and tags so the manifest stays in sync with the TS source.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Generating farcaster.json from minikit.config.ts...');

const configPath = path.join(__dirname, '..', 'minikit.config.ts');

function extractBalanced(content, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < content.length; i++) {
    const c = content[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return content.slice(openBraceIndex + 1, i);
    }
  }
  return null;
}

function extractKeyedBlock(parent, key) {
  const re = new RegExp(`\\b${key}:\\s*\\{`);
  const m = parent.match(re);
  if (!m) return null;
  const openIdx = parent.indexOf(m[0]) + m[0].length - 1;
  return extractBalanced(parent, openIdx);
}

function quotedField(block, key) {
  const re = new RegExp(`\\b${key}:\\s*"([^"]*)"`, 'm');
  const match = block.match(re);
  return match ? match[1] : undefined;
}

function parseStringArray(block, key) {
  const re = new RegExp(`\\b${key}:\\s*\\[([\\s\\S]*?)\\]`, 'm');
  const m = block.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]);
}

try {
  const configContent = fs.readFileSync(configPath, 'utf8');

  const rootUrlMatch = configContent.match(
    /const ROOT_URL = process\.env\.REACT_APP_FRONTEND_URL \|\| '([^']+)';/,
  );
  const rootUrl = rootUrlMatch ? rootUrlMatch[1] : 'https://boing.finance';
  console.log(`📍 Using ROOT_URL: ${rootUrl}`);

  const cfgStart = configContent.indexOf('export const minikitConfig');
  if (cfgStart < 0) throw new Error('minikitConfig export not found');
  const open = configContent.indexOf('{', cfgStart);
  const configBody = extractBalanced(configContent, open);
  if (!configBody) throw new Error('Could not parse minikitConfig object');

  const assocBlock = extractKeyedBlock(configBody, 'accountAssociation');
  const miniBlock = extractKeyedBlock(configBody, 'miniapp');
  if (!assocBlock || !miniBlock) {
    throw new Error('Could not find accountAssociation or miniapp block');
  }

  function appendAssetVersion(url, ver) {
    if (!url || !ver || String(url).includes('?')) return url;
    try {
      new URL(url);
      return `${url}?v=${encodeURIComponent(ver)}`;
    } catch {
      return url;
    }
  }

  let assetVersion = '';
  try {
    assetVersion = fs
      .readFileSync(path.join(__dirname, '..', 'public', 'version.txt'), 'utf8')
      .trim();
  } catch (_) {
    /* optional during fresh clone */
  }

  const manifest = {
    accountAssociation: {
      header: quotedField(assocBlock, 'header'),
      payload: quotedField(assocBlock, 'payload'),
      signature: quotedField(assocBlock, 'signature'),
    },
    miniapp: {
      version: quotedField(miniBlock, 'version'),
      name: quotedField(miniBlock, 'name'),
      iconUrl: quotedField(miniBlock, 'iconUrl'),
      homeUrl: quotedField(miniBlock, 'homeUrl'),
      splashImageUrl: quotedField(miniBlock, 'splashImageUrl'),
      splashBackgroundColor: quotedField(miniBlock, 'splashBackgroundColor'),
      heroImageUrl: quotedField(miniBlock, 'heroImageUrl'),
      tagline: quotedField(miniBlock, 'tagline'),
      primaryCategory: quotedField(miniBlock, 'primaryCategory'),
      tags: parseStringArray(miniBlock, 'tags'),
    },
  };

  if (assetVersion) {
    manifest.miniapp.iconUrl = appendAssetVersion(manifest.miniapp.iconUrl, assetVersion);
    manifest.miniapp.heroImageUrl = appendAssetVersion(manifest.miniapp.heroImageUrl, assetVersion);
  }

  const missing = [];
  ['header', 'payload', 'signature'].forEach((k) => {
    if (!manifest.accountAssociation[k]) missing.push(`accountAssociation.${k}`);
  });
  ['version', 'name', 'iconUrl', 'homeUrl'].forEach((k) => {
    if (!manifest.miniapp[k]) missing.push(`miniapp.${k}`);
  });
  if (missing.length) {
    throw new Error(`Missing fields: ${missing.join(', ')}`);
  }

  const manifestPath = path.join(__dirname, '..', 'public', '.well-known', 'farcaster.json');
  const manifestDir = path.dirname(manifestPath);
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log('✅ Generated farcaster.json successfully');
  console.log(`📁 Location: ${manifestPath}`);
  console.log(`🌐 Manifest URL: ${rootUrl}/.well-known/farcaster.json`);
} catch (error) {
  console.error('❌ Error generating manifest:', error.message);
  process.exit(1);
}
