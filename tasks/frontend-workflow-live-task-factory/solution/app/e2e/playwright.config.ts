import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3845);

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  // Keep local runs aligned with the pinned oracle CI runner: distribute long
  // rubric probes so the complete suite stays within the workflow timeout.
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 7_000 },
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${port}`,
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite preview .. --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
