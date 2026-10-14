import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

/**
 * bundle-size.mjs の検査漏れ防止（#786）。
 * 一時ディレクトリに dist fixture を作り、実スクリプトを子プロセスで実行して
 * 終了コードと出力を検証する。
 */

const SCRIPT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "bundle-size.mjs"
);

const tmpDirs = [];

function makeDist(files) {
  const root = mkdtempSync(join(tmpdir(), "bundle-size-"));
  tmpDirs.push(root);
  mkdirSync(join(root, "wasm"), { recursive: true });
  writeFileSync(join(root, "wasm", "tdsl_wasm_bg.wasm"), Buffer.alloc(100));
  mkdirSync(join(root, "_astro"), { recursive: true });
  for (const [rel, size] of Object.entries(files)) {
    const path = join(root, "_astro", rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.alloc(size));
  }
  return root;
}

function run(distDir) {
  return spawnSync(process.execPath, [SCRIPT_PATH], {
    env: { ...process.env, BUNDLE_SIZE_DIST_DIR: distDir },
    encoding: "utf-8",
  });
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("bundle-size.mjs", () => {
  it("直下の JS/CSS が予算内なら成功する", () => {
    const result = run(makeDist({ "a.js": 1000, "style.css": 100 }));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("all metrics within budget");
  });

  it("JS/CSS が 0 件なら失敗する", () => {
    const result = run(makeDist({}));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No JS files found");
  });

  it("CSS だけ 0 件でも失敗する", () => {
    const result = run(makeDist({ "a.js": 1000 }));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No CSS files found");
  });

  it("サブディレクトリ内の閾値超過 JS を検出する", () => {
    const result = run(
      makeDist({ "chunks/large.js": 900_000, "style.css": 100 })
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("FAIL");
    expect(result.stdout).toContain("chunks/large.js");
  });
});
