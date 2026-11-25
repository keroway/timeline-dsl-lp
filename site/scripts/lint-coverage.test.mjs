import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * JS/TS 系ソースの拡張子が Biome（CI の lint / format:check）と
 * lefthook の pre-commit biome job の両方で対象になっていることを守る（#850）。
 * 新しい拡張子（例: .mts / .cjs）のファイルを足したときに対象漏れを検知する。
 */

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_DIR = resolve(SITE_DIR, "..");
const SCRIPT_EXTS = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".astro",
  "public",
  "test-results",
  "playwright-report",
  ".lighthouseci",
  ".playwright-snapshots",
]);

function collectExts(dir, found = new Set()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
        collectExts(join(dir, entry.name), found);
      }
    } else if (SCRIPT_EXTS.has(extname(entry.name))) {
      found.add(extname(entry.name));
    }
  }
  return found;
}

const usedExts = [...collectExts(SITE_DIR)].sort();

describe("lint coverage", () => {
  it("finds script files to check", () => {
    expect(usedExts).toContain(".ts");
  });

  it("biome.json includes every script extension used in site/", () => {
    const { files } = JSON.parse(
      readFileSync(join(SITE_DIR, "biome.json"), "utf8")
    );
    const missing = usedExts.filter(
      (ext) => !files.includes.includes(`**/*${ext}`)
    );
    expect(missing).toEqual([]);
  });

  it("lefthook biome job glob covers every script extension used in site/", () => {
    const lefthook = readFileSync(join(REPO_DIR, "lefthook.yml"), "utf8");
    const match = lefthook.match(
      /name: biome check[^\n]*\n(?:[^\n]*\n)*?\s*glob: "\*\.\{([^}]+)\}"/
    );
    expect(match).not.toBeNull();
    const globExts = match[1].split(",").map((ext) => `.${ext.trim()}`);
    const missing = usedExts.filter((ext) => !globExts.includes(ext));
    expect(missing).toEqual([]);
  });
});
