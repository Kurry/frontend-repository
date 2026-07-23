import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 40_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3640',
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start -- --port 3640',
    url: 'http://127.0.0.1:3640',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
