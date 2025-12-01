// Script to generate a version manifest file on each build
// This file is used to detect new deployments and force cache invalidation

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../build');
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
  buildHash: Math.random().toString(36).substring(2, 15)
};

// Ensure directories exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write version manifest to public directory (will be copied to build by react-scripts)
const publicManifestPath = path.join(publicDir, 'version.json');
fs.writeFileSync(publicManifestPath, JSON.stringify(versionManifest, null, 2), 'utf8');

// Write a simple version.txt file for easy checking
const publicVersionTxtPath = path.join(publicDir, 'version.txt');
fs.writeFileSync(publicVersionTxtPath, version, 'utf8');

// Also write to build directory if it exists (for post-build)
if (fs.existsSync(buildDir)) {
  const buildManifestPath = path.join(buildDir, 'version.json');
  fs.writeFileSync(buildManifestPath, JSON.stringify(versionManifest, null, 2), 'utf8');
  
  const buildVersionTxtPath = path.join(buildDir, 'version.txt');
  fs.writeFileSync(buildVersionTxtPath, version, 'utf8');
}

console.log(`✅ Generated version manifest: ${version}`);
console.log(`✅ Version manifest written to: ${publicManifestPath}`);

