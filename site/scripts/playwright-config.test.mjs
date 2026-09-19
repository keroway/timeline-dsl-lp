import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * `playwright.config.ts` の baseURL / webServer が PORT env に追従すること (#705)。
 *
 * `check:full` は preview を PORT で起動するが、以前は playwright.config.ts の
 * baseURL / webServer.url が 4321 固定だったため test:visual だけ別サーバーを
 * 検査していた。設定ファイルを直接 import すると `playwright/test` への依存が
 * 必要になるため、`defineConfig` / `devices` をスタブした vm 上で評価し、
 * 実際に生成される config オブジェクトの値だけを確認する。
 */

const CONFIG_DIR = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(CONFIG_DIR, "..", "playwright.config.ts");

async function loadConfig({ port } = {}) {
  const raw = await readFile(CONFIG_PATH, "utf-8");
  const source = raw
    .replace(/^import .*\n/gm, "")
    .replace(
      "export default defineConfig(",
      "globalThis.__config = defineConfig("
    );

  const ctx = {
    process: { env: port ? { PORT: port } : {} },
    defineConfig: (config) => config,
    devices: { "Desktop Chrome": {} },
    globalThis: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(source, ctx);

  return ctx.__config;
}

describe("playwright.config.ts の PORT 追従", () => {
  it("PORT 未指定なら従来通り 4321 を使う", async () => {
    const config = await loadConfig();

    expect(config.use.baseURL).toBe("http://127.0.0.1:4321");
    expect(config.webServer.url).toBe("http://127.0.0.1:4321");
    expect(config.webServer.command).toBe("pnpm preview --port 4321");
  });

  it("PORT が指定されたら baseURL と webServer が同じ値に揃う", async () => {
    const config = await loadConfig({ port: "54321" });

    expect(config.use.baseURL).toBe("http://127.0.0.1:54321");
    expect(config.webServer.url).toBe("http://127.0.0.1:54321");
    expect(config.webServer.command).toBe("pnpm preview --port 54321");
  });
});
