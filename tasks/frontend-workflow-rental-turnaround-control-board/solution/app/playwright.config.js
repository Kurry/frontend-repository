import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
