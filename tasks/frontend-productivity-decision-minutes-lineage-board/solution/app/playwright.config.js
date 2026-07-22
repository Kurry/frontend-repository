import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true,
  },
});
