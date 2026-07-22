import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3642' },
  webServer: {
    // Mirrors CI/`npm start`: serve the production build, not the dev server.
    // The 2s cold-load interactivity budget (5.1) cannot be met by Vite's dev
    // server, which lazily transforms modules and pre-bundles deps on first
    // navigation.
    command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 3642 --strictPort',
    url: 'http://127.0.0.1:3642',
    reuseExistingServer: false,
  },
})
