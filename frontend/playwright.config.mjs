import { defineConfig } from '@playwright/test';

/** E2E_BASE_URL=https://boing.finance runs the suite against a deployed site (no local build/preview). */
const remoteBase = process.env.E2E_BASE_URL?.trim();

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Main-branch push CI has flaked after green PR runs; retry once before failing the job.
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: remoteBase || 'http://127.0.0.1:4173',
    // Avoid hanging forever when preview has no Pages Functions /backend.
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  webServer: remoteBase
    ? undefined
    : {
        command: 'node scripts/build-with-test-pool.mjs && npx vite preview --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
