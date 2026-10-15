/**
 * Ensures REACT_APP_BOING_NATIVE_AMM_POOL is set for vite build (Playwright / CI).
 * Nested `npm run build` on some shells does not inherit cross-env from the parent line.
 *
 * Playwright preview needs a non-empty pool env so the 6913 UI compiles. The fallback hex is a
 * historical fixture (previous tunnel ledger), not a live Fly testnet id — override for isolated nodes.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const pool =
  process.env.REACT_APP_BOING_NATIVE_AMM_POOL ||
  '0x5b60d6f8514d1a8a40340fa354951d778b0821cd3ff7e534d0bea50f67d38976';

const env = { ...process.env, REACT_APP_BOING_NATIVE_AMM_POOL: pool };
const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env, shell: true });
process.exit(r.status ?? 1);
