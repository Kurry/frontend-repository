import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3633' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3633',
    url: 'http://127.0.0.1:3633',
    reuseExistingServer: false,
  },
})
