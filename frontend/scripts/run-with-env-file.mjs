/**
 * Merge a dotenv-style file into the environment, then exec a command.
 * Later keys in process.env (e.g. GitHub Actions `env:`) win over the file.
 *
 * Usage: node scripts/run-with-env-file.mjs <path-relative-to-frontend/> -- <command> [args...]
 * Example: node scripts/run-with-env-file.mjs env/github-build.production.env -- npm run build:prod
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');

const args = process.argv.slice(2);
const sep = args.indexOf('--');
if (sep === -1) {
  console.error('Usage: node scripts/run-with-env-file.mjs <envfile> -- <command> [args...]');
  process.exit(1);
}
const rel = args[0];
const cmdParts = args.slice(sep + 1);
if (!rel || cmdParts.length === 0) {
  console.error('Usage: node scripts/run-with-env-file.mjs <envfile> -- <command> [args...]');
  process.exit(1);
}

const envPath = path.resolve(frontendRoot, rel);

/** @param {string} text */
function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

let fileVars = {};
try {
  fileVars = parseEnvFile(readFileSync(envPath, 'utf8'));
} catch (e) {
  console.error('[run-with-env-file] Missing or unreadable env file:', envPath, e);
  process.exit(1);
}

const childEnv = { ...fileVars, ...process.env };
const [cmd0, ...cmdRest] = cmdParts;
const r = spawnSync(cmd0, cmdRest, {
  env: childEnv,
  stdio: 'inherit',
  shell: true,
  cwd: frontendRoot,
});
process.exit(r.status ?? 1);
