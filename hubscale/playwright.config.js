// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for HubScale E2E tests.
 * Targets LOCAL/DEMO mode (no Supabase required).
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Maximum time one test can run */
  timeout: 30_000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10_000,
  },

  /* Run tests sequentially in CI, parallel locally */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once in CI */
  retries: process.env.CI ? 1 : 0,

  /* Reporter */
  reporter: process.env.CI ? 'dot' : 'list',

  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:5173',
    /* Collect trace on first retry */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Default navigation timeout */
    navigationTimeout: 15_000,
    /* Default action timeout */
    actionTimeout: 10_000,
  },

  /* Use only Chromium for speed */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],

  /* Start the dev server before running tests */
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
