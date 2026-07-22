import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.', testMatch: 'e2e.spec.mjs',
  use: { baseURL: 'http://127.0.0.1:3639', video: 'on', recordVideo: { dir: 'testing/' }, launchOptions: { args: ['--enable-features=WebCodecsVideoEncoder,PlatformHEVCEncoderSupport'] } },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3639',
    url: 'http://127.0.0.1:3639',
    reuseExistingServer: false,
  },
})
