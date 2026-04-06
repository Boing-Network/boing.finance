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

if (existsSync(sdkRoot) && !existsSync(distIndex)) {
  const r = spawnSync('npm', ['run', 'build'], { cwd: sdkRoot, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(
      '[postinstall-boing-sdk] npm run build in boing-sdk failed. From repo root: cd ../boing.network/boing-sdk && npm ci && npm run build',
    );
    process.exit(1);
  }
}
