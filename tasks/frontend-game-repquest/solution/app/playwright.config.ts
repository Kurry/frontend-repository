import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e.spec.mjs', 'e2e/oracle.spec.ts'],
  timeout: 45_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3103',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 3103 --strictPort',
    url: 'http://127.0.0.1:3103',
    reuseExistingServer: false,
  },
});
