import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    video: 'on', // record video for all tests
  },
  outputDir: 'environment/reference-screenshots', // videos go here under test name
});
