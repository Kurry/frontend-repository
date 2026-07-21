import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3636' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3636',
    url: 'http://127.0.0.1:3636',
    reuseExistingServer: false,
  },
})
