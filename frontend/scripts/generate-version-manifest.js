// Script to generate a version manifest file on each build
// This file is used to detect new deployments and force cache invalidation

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const publicDir = path.join(__dirname, '../public');

// Generate a unique version based on timestamp and random string
const version = `v${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const buildTimestamp = new Date().toISOString();

// Create version manifest object
const versionManifest = {
  version,
  buildTimestamp,
  buildDate: buildTimestamp,
  // Add a hash to make it unique even if timestamp is the same
  buildHash: Math.random().toString(36).substring(2, 15),
};

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Written to public/ so Vite copies into dist/ on build; also mirror to dist/ if it already exists (e.g. post-build)
const publicManifestPath = path.join(publicDir, 'version.json');
fs.writeFileSync(publicManifestPath, JSON.stringify(versionManifest, null, 2), 'utf8');

const publicVersionTxtPath = path.join(publicDir, 'version.txt');
fs.writeFileSync(publicVersionTxtPath, version, 'utf8');

if (fs.existsSync(distDir)) {
  const buildManifestPath = path.join(distDir, 'version.json');
  fs.writeFileSync(buildManifestPath, JSON.stringify(versionManifest, null, 2), 'utf8');

  const buildVersionTxtPath = path.join(distDir, 'version.txt');
  fs.writeFileSync(buildVersionTxtPath, version, 'utf8');
}

console.log(`✅ Generated version manifest: ${version}`);
console.log(`✅ Version manifest written to: ${publicManifestPath}`);
