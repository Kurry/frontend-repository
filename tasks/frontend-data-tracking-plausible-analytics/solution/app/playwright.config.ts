import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'e2e.spec.mjs'],
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:3643',
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: 'PORT=3643 npm run start',
    url: 'http://127.0.0.1:3643',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
