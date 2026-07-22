import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // CI owns browser execution; reuse the app server exposed by the verifier.
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
  },
});
