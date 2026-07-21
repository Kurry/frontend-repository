import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3623',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start -- --port 3623',
    url: 'http://127.0.0.1:3623',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
