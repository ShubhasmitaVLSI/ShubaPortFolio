import { defineConfig, devices } from "@playwright/test";

// Edge by default; PW_CHANNEL=chromium uses Playwright's bundled browser instead.
const channel = process.env.PW_CHANNEL === "chromium" ? undefined : process.env.PW_CHANNEL || "msedge";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3100",
    channel,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", channel } },
  ],
});
