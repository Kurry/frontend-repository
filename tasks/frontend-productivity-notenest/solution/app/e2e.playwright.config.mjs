import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
