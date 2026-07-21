import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3647' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3647',
    url: 'http://127.0.0.1:3647',
    reuseExistingServer: false,
  },
})
