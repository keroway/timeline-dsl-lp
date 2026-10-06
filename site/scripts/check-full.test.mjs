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
 * @param {{ readyOnFirstFetch: boolean, env?: Record<string, string>, dateStepMs?: number }} options
 */
async function runInSandbox({
  readyOnFirstFetch,
  env = {},
  dateStepMs = 31_000,
  interruptWith,
}) {
  const raw = await readFile(SCRIPT_PATH, "utf-8");
  const source = raw.replace('import { spawn } from "node:child_process";', "");

  let spawnCount = 0;
  let killCount = 0;
  let exitCode;
  let now = 0;
  const logs = [];
  const spawnCalls = [];
  const signalHandlers = {};

  const ctx = {
    console: {
      log: (...args) => logs.push(args.join(" ")),
      error: (...args) => logs.push(args.join(" ")),
    },
    process: {
      env,
      platform: "darwin",
      once: (signal, handler) => {
        signalHandlers[signal] = handler;
      },
      // 実プロセスと違い exit() で止まらないので、最初の終了コードだけ採用し、
      // readiness ループが締め切りへ達して抜けるよう時刻を進める。
      exit: (code) => {
        exitCode ??= code;
        now += 1_000_000;
      },
    },
    Date: { now: () => (now += dateStepMs) },
    setTimeout,
    fetch: async () => {
      if (readyOnFirstFetch) {
        return { status: 200 };
      }
      throw new Error("connection refused — not up yet");
    },
    spawn: (command, args, opts) => {
      spawnCount += 1;
      const isPreviewServer = spawnCount === 2;
      spawnCalls.push({ command, args, opts });
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
      } else if (interruptWith) {
        // preview 起動後（readiness 待機中）に終了シグナルを受けた状況を再現する。
        setTimeout(() => signalHandlers[interruptWith]?.(), 10);
      }
      return child;
    },
  };

  await vm.runInNewContext(`(async () => { ${source} })()`, ctx);

  return { spawnCount, killCount, exitCode, logs, spawnCalls, signalHandlers };
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
    // 既定の 31s 刻みだと最初の deadline 判定で readiness ループへ入れず
    // timeout 経路になるため、ループに入れる程度の刻みにする（#748）。
    const result = await runInSandbox({
      readyOnFirstFetch: true,
      dateStepMs: 1,
    });
    const log = result.logs.join("\n");

    expect(result.exitCode).toBe(0);
    expect(log).toContain("Preview server ready.");
    expect(log).toContain("check:full passed");
    expect(log).not.toContain("check:full failed");
    // pnpm check + preview server + browser ゲート 8 本（seo 〜 lhci）
    expect(result.spawnCount).toBe(10);
    expect(result.spawnCalls.at(-1).args).toContain("lhci");
    expect(result.killCount).toBeGreaterThanOrEqual(1);
    expect(log).toContain("Stopping preview server");
  });

  it.each([
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ])(
    "%s を受けたら preview へ終了要求を出し %i で終了する (#760)",
    async (signal, code) => {
      const result = await runInSandbox({
        readyOnFirstFetch: false,
        dateStepMs: 1,
        interruptWith: signal,
      });

      expect(Object.keys(result.signalHandlers).sort()).toEqual([
        "SIGINT",
        "SIGTERM",
      ]);
      expect(result.exitCode).toBe(code);
      expect(result.killCount).toBeGreaterThanOrEqual(1);
      expect(result.logs.join("\n")).toContain(`interrupted (${signal})`);
    }
  );

  it("非デフォルト PORT が test:visual の起動 env にも反映される (#705)", async () => {
    const result = await runInSandbox({
      readyOnFirstFetch: true,
      env: { PORT: "54321" },
      // readiness チェックが実際に成功して browserSteps 全体（test:visual 含む）
      // まで進むよう、deadline を追い越さない程度の刻みにする。
      dateStepMs: 1,
    });

    const visualCall = result.spawnCalls.find((call) =>
      call.args?.includes("test:visual")
    );
    expect(visualCall).toBeDefined();
    expect(visualCall.opts.env.PORT).toBe("54321");
  });
});
