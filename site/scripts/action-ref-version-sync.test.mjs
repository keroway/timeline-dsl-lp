import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * docs が案内する `uses: keroway/timeline-dsl@<ref>` の更新漏れを防ぐ (#909)。
 *
 * 本体は移動タグ（@v3 など）を提供しないため、docs は完全な版番号を案内している。
 * 同梱 WASM (site/public/wasm/package.json) の version を正とし、docs 配下のすべての
 * 参照が v<version> と一致することを検査する。`version:` 入力の例は古くても動作する
 * ため照合しない。
 */

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(SCRIPTS_DIR, "..");
const DOCS_DIR = resolve(SITE_ROOT, "src/content/docs");

describe("docs の keroway/timeline-dsl@<ref>", () => {
  it("すべて同梱 WASM の版 (v<version>) と一致している", async () => {
    const { version } = JSON.parse(
      await readFile(resolve(SITE_ROOT, "public/wasm/package.json"), "utf-8")
    );
    expect(version, "public/wasm/package.json に version がない").toMatch(
      /^\d+\.\d+\.\d+/
    );

    const entries = await readdir(DOCS_DIR, {
      recursive: true,
      withFileTypes: true,
    });
    const refs = [];
    for (const entry of entries) {
      if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
      const path = resolve(entry.parentPath, entry.name);
      const lines = (await readFile(path, "utf-8")).split("\n");
      for (const [index, line] of lines.entries()) {
        for (const m of line.matchAll(/keroway\/timeline-dsl@([\w.-]+)/g)) {
          refs.push({
            where: `${relative(SITE_ROOT, path)}:${index + 1}`,
            ref: m[1],
          });
        }
      }
    }

    expect(
      refs.length,
      "docs に keroway/timeline-dsl@<ref> が1件も見つからない（検査対象の取りこぼし）"
    ).toBeGreaterThan(0);

    const expected = `v${version}`;
    expect(refs.filter(({ ref }) => ref !== expected)).toEqual([]);
  });
});
