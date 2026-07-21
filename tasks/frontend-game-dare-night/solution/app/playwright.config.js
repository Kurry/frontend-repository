import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 3641);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 40_000,
  reporter: 'line',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `ASTRO_DEV_BACKGROUND=0 ./node_modules/.bin/astro dev --port=${port} --host=127.0.0.1 --ignore-lock`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 30_000
  }
});
