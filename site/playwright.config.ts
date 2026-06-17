import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: ".playwright-snapshots",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "off",
    screenshot: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        colorScheme: "light",
      },
    },
  ],
  webServer: {
    command: "pnpm preview",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
