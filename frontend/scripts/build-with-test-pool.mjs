/**
 * Ensures REACT_APP_BOING_NATIVE_AMM_POOL is set for vite build (Playwright / CI).
 * Nested `npm run build` on some shells does not inherit cross-env from the parent line.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const pool =
  process.env.REACT_APP_BOING_NATIVE_AMM_POOL ||
  '0x1111111111111111111111111111111111111111111111111111111111111111';

const env = { ...process.env, REACT_APP_BOING_NATIVE_AMM_POOL: pool };
const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env, shell: true });
process.exit(r.status ?? 1);
