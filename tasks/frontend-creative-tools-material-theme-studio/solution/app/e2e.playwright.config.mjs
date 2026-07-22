// Canonical config for the workspace-contract suite (e2e.spec.mjs). Owned by
// `corpuscheck propagate` — never hand-edit. Exists so the canonical suite runs
// identically even when an app ships its own playwright.config for other tests:
//   npx playwright test -c e2e.playwright.config.mjs
// The app must already be serving on port 3000 (`npm run start`).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:3000' },
});
