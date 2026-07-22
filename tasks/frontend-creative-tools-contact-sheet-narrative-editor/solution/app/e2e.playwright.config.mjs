import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'e2e.spec.mjs',
  use: {
    video: 'on',
    viewport: { width: 1440, height: 900 }
  },
  outputDir: '../../environment/reference-screenshots', // Needs to map to environment/reference-screenshots
});
