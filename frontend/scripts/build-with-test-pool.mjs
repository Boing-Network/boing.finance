/**
 * Ensures REACT_APP_BOING_NATIVE_AMM_POOL is set for vite build (Playwright / CI).
 * Nested `npm run build` on some shells does not inherit cross-env from the parent line.
 *
 * Default below matches public testnet canonical pool in src/config/boingCanonicalTestnetPool.js so E2E
 * builds align with chain 6913 + testnet-rpc; override env for isolated nodes.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const pool =
  process.env.REACT_APP_BOING_NATIVE_AMM_POOL ||
  '0x7247ddc3180fdc4d3fd1e716229bfa16bad334a07d28aa9fda9ad1bfa7bdacc3';

const env = { ...process.env, REACT_APP_BOING_NATIVE_AMM_POOL: pool };
const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env, shell: true });
process.exit(r.status ?? 1);
