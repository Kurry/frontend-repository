import { defineConfig } from '@playwright/test';

const e2ePort = 3416;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  // 30s was tight enough that on a loaded CI runner (as opposed to a fast
  // local machine) multi-step tests could hit the whole-test timeout before
  // genuinely-correct, slower-to-render UI state was ever observed (seen live
  // in CI: "Test timeout of 30000ms exceeded" on tests with no logic issue).
  // Widen the budget rather than touch any assertion.
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['line']],
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm start -- --port ${e2ePort}`,
    url: `http://127.0.0.1:${e2ePort}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
