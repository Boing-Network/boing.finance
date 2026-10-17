import { defineConfig } from '@playwright/test';

/** E2E_BASE_URL=https://boing.finance runs the suite against a deployed site (no local build/preview). */
const remoteBase = process.env.E2E_BASE_URL?.trim();

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: remoteBase || 'http://127.0.0.1:4173',
  },
  webServer: remoteBase
    ? undefined
    : {
        command: 'node scripts/build-with-test-pool.mjs && npx vite preview --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      },
});
