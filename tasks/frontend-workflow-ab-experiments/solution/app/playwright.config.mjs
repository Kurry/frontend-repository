import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  use: { baseURL: 'http://localhost:3000' }, timeout: 3000,
});
