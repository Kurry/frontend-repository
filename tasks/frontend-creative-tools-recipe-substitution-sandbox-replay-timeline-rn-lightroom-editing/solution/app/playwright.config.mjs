import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: /.*\.spec\.mjs/,
  use: {
    video: 'on',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
