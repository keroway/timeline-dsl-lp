import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * `check:full` の preview server ライフサイクル管理（#645）。
 *
 * ## なぜ vm でサンドボックス実行するか
 *
 * 検証したいのは「readiness 待機が失敗しても preview の子プロセスへ
 * 終了要求が出ること」で、実際の Astro preview server やブラウザ smoke を
 * 起動せずに再現したい。`spawn` / `fetch` / `Date.now` / `setTimeout` を
 * 差し替えたサンドボックスでスクリプト全体を実行し、生成された子プロセスの
 * 数と `kill()` 呼び出し回数だけを観測する。
 */

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(SCRIPTS_DIR, "check-full.mjs");

/**
 * @param {{ readyOnFirstFetch: boolean }} options
 */
async function runInSandbox({ readyOnFirstFetch }) {
  const raw = await readFile(SCRIPT_PATH, "utf-8");
  const source = raw.replace('import { spawn } from "node:child_process";', "");

  let spawnCount = 0;
  let killCount = 0;
  let exitCode;
  let now = 0;
  const logs = [];

  const ctx = {
    console: {
      log: (...args) => logs.push(args.join(" ")),
      error: (...args) => logs.push(args.join(" ")),
    },
    process: {
      env: {},
      platform: "darwin",
      exit: (code) => {
        exitCode = code;
      },
    },
    Date: { now: () => (now += 31_000) },
    setTimeout,
    fetch: async () => {
      if (readyOnFirstFetch) {
        return { status: 200 };
      }
      throw new Error("connection refused — not up yet");
    },
    spawn: () => {
      spawnCount += 1;
      const isPreviewServer = spawnCount === 2;
      const child = new EventEmitter();
      child.exitCode = null;
      child.signalCode = null;
      child.kill = () => {
        killCount += 1;
        // Real child processes emit `exit` asynchronously after being
        // killed; `stopPreview` waits on that event to resolve.
        queueMicrotask(() => child.emit("exit", null, "SIGTERM"));
        return true;
      };
      // Every step except the preview server (the 2nd spawn — after
      // `pnpm check`, before any browser-dependent step) resolves
      // immediately, so the preview server is the only long-lived child.
      if (!isPreviewServer) {
        queueMicrotask(() => child.emit("exit", 0));
      }
      return child;
    },
  };

  await vm.runInNewContext(`(async () => { ${source} })()`, ctx);

  return { spawnCount, killCount, exitCode, logs };
}

describe("check-full.mjs の preview server ライフサイクル", () => {
  it("readiness timeout でも preview の子プロセスへ終了要求を出す", async () => {
    const result = await runInSandbox({ readyOnFirstFetch: false });

    expect(result.spawnCount).toBe(2); // check step + preview server
    expect(result.killCount).toBeGreaterThanOrEqual(1);
    expect(result.logs.join("\n")).toContain("Stopping preview server");
    expect(result.exitCode).toBe(1);
  });

  it("readiness に成功した通常経路でも preview を終了する", async () => {
    const result = await runInSandbox({ readyOnFirstFetch: true });

    expect(result.spawnCount).toBeGreaterThanOrEqual(2);
    expect(result.killCount).toBeGreaterThanOrEqual(1);
    expect(result.logs.join("\n")).toContain("Stopping preview server");
  });
});
