import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

/**
 * データ取得スクリプトの失敗時の振る舞い（#577）。
 *
 * ## なぜ実プロセスを起動するか
 *
 * 検証したいのは「**終了コードが非ゼロになること**」と「既存ファイルを
 * 上書きしないこと」の 2 点で、前者はプロセスを実際に走らせないと測れない。
 * 以前の実装は空データを書いて exit 0 しており、workflow が緑のまま
 * 「全リリースを削除する PR」を作っていた。
 *
 * API は localhost の HTTP サーバに向ける（`GITHUB_API_BASE`）。
 * ネットワークへ出ず、レート制限にも左右されない。
 */

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(SCRIPTS_DIR, "../src/data");

const TARGETS = [
  {
    script: "fetch-github-releases.mjs",
    dataFile: resolve(DATA_DIR, "releases.generated.json"),
  },
  {
    script: "fetch-github-repo-stats.mjs",
    dataFile: resolve(DATA_DIR, "repo-stats.generated.json"),
  },
];

/** 常に 403 を返すローカルサーバを立て、`http://127.0.0.1:<port>` を返す。 */
async function startFailingApi() {
  const server = createServer((_req, res) => {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "rate limit exceeded" }));
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((done) => server.close(done)),
  };
}

function runScript(script, base) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [resolve(SCRIPTS_DIR, script)], {
      env: { ...process.env, GITHUB_API_BASE: base, GITHUB_TOKEN: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdout.resume();
    child.on("close", (code) => done({ code, stderr }));
  });
}

/** テストで壊した生成ファイルを元に戻すための退避先。 */
const restore = new Map();

afterEach(async () => {
  for (const [file, content] of restore) {
    await writeFile(file, content);
  }
  restore.clear();
});

describe.each(TARGETS)("$script", ({ script, dataFile }) => {
  it("API が失敗しても既存ファイルを上書きせず、非ゼロ終了する", async () => {
    const before = await readFile(dataFile, "utf8");
    restore.set(dataFile, before);

    // 上書きされたことを検出できるよう、中身があることを先に確かめておく。
    // 空ファイルを相手にすると「変わっていない」が偶然成立してしまう。
    expect(before.length).toBeGreaterThan(100);

    const api = await startFailingApi();
    try {
      const { code, stderr } = await runScript(script, api.base);

      // not.toBe(0) だと終了コード 2 やシグナル終了の null も通ってしまう。
      expect(code, `stderr: ${stderr}`).toBe(1);
      expect(stderr).toMatch(/403/);
      expect(await readFile(dataFile, "utf8")).toBe(before);
    } finally {
      await api.close();
    }
  });
});
