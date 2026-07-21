import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3654' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3654',
    url: 'http://127.0.0.1:3654',
    reuseExistingServer: false,
  },
})
