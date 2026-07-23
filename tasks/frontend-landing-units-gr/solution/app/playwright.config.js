import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3631",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "PORT=3631 npm run start",
    url: "http://127.0.0.1:3631",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
