/**
 * Ensure file-linked `boing-sdk` has `dist/` (prepare does not always run on parent `npm ci`).
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const sdkRoot = join(frontendRoot, 'node_modules', 'boing-sdk');
const distIndex = join(sdkRoot, 'dist', 'index.js');

if (!existsSync(sdkRoot)) {
  process.exit(0);
}

/** Wrangler bundles `boing-sdk/dist/*.js` and resolves `@noble/*` from `boing-sdk/node_modules`. */
const nobleHashes = join(sdkRoot, 'node_modules', '@noble', 'hashes', 'package.json');
if (!existsSync(nobleHashes)) {
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: sdkRoot, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('[postinstall-boing-sdk] npm install in boing-sdk failed (needed for @noble/* resolution).');
    process.exit(1);
  }
}

if (!existsSync(distIndex)) {
  const r = spawnSync('npm', ['run', 'build'], { cwd: sdkRoot, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(
      '[postinstall-boing-sdk] npm run build in boing-sdk failed. From repo root: cd ../boing.network/boing-sdk && npm ci && npm run build',
    );
    process.exit(1);
  }
}
