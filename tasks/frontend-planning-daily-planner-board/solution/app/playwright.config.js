const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3650",
    headless: true,
  },
  webServer: {
    command: "npx serve -l 3650 -n",
    url: "http://127.0.0.1:3650",
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
