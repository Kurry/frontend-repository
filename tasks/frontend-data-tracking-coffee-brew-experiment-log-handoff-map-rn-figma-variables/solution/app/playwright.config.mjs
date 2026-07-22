import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    video: 'on',
    viewport: { width: 1280, height: 720 }
  },
});
