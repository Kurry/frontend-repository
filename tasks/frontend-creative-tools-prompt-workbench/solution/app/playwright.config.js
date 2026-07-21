import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3627',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start -- --port 3627',
    url: 'http://127.0.0.1:3627',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
