import { defineConfig, devices } from "playwright/test";

// check:full が渡す PORT に追従する (astro.config.mjs の devServerPort と同じ規約)。
// 未指定なら従来通り 4321。
const previewPort = process.env.PORT ? Number(process.env.PORT) : 4321;
const baseURL = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: ".playwright-snapshots",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
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
    command: `pnpm preview --port ${previewPort}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
