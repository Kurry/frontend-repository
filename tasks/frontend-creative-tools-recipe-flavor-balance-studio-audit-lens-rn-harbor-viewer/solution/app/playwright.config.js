import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true,
  },
});
