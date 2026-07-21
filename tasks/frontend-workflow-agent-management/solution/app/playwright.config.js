import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3656',
    headless: true,
  },
  webServer: {
    command: './node_modules/.bin/vite --host 127.0.0.1 --port 3656 --strictPort',
    url: 'http://127.0.0.1:3656',
    timeout: 30_000,
    reuseExistingServer: false,
  },
})
