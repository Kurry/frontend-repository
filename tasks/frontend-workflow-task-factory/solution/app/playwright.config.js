import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3629' },
  webServer: {
    // Measure and exercise the production bundle. Vite's first-request module
    // compilation is development-server work, not application cold-load time.
    command: 'npm run verify:build && npx vite preview --host 127.0.0.1 --port 3629',
    url: 'http://127.0.0.1:3629',
    reuseExistingServer: false,
  },
})
