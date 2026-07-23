import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  timeout: 15_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:3628',
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } }
      : {}),
  },
  webServer: {
    command: 'npm run start -- --port 3628',
    url: 'http://127.0.0.1:3628',
    reuseExistingServer: false,
  },
})
