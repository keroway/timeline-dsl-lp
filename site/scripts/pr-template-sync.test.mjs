import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * PR template の検証ゲート説明が package.json scripts の実装と乖離するのを防ぐ (#631)。
 *
 * テキストの完全一致までは求めず、各コマンドが実際に使っているツール名が
 * template の説明文に含まれているかだけを見る。ツールを差し替えたのに
 * template を直し忘れる、というドリフトを検出できれば十分。
 */

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, "../..");

async function readTemplateChecklistLine(templateBody, scriptName) {
  const line = templateBody
    .split("\n")
    .find((l) => l.includes(`\`pnpm ${scriptName}\``));
  if (!line) {
    throw new Error(
      `pull_request_template.md に \`pnpm ${scriptName}\` の検証項目が見つからない`
    );
  }
  return line;
}

describe("PR template の検証ゲート説明", () => {
  it("package.json scripts の実装と同期している", async () => {
    const [packageJsonRaw, templateBody] = await Promise.all([
      readFile(resolve(REPO_ROOT, "site/package.json"), "utf-8"),
      readFile(resolve(REPO_ROOT, ".github/pull_request_template.md"), "utf-8"),
    ]);
    const scripts = JSON.parse(packageJsonRaw).scripts;

    const buildLine = await readTemplateChecklistLine(templateBody, "build");
    expect(scripts.build).toContain("vitest run src/lib/smoke-catalog.test.ts");
    expect(buildLine).toContain("smoke-catalog");

    const lintLine = await readTemplateChecklistLine(templateBody, "lint");
    expect(scripts.lint).toContain("biome");
    expect(lintLine).toContain("Biome");
    expect(lintLine).not.toContain("ESLint");

    const formatCheckLine = await readTemplateChecklistLine(
      templateBody,
      "format:check"
    );
    expect(scripts["format:check"]).toContain("biome");
    expect(scripts["format:check"]).toContain("prettier");
    expect(formatCheckLine).toContain("Biome");
    expect(formatCheckLine).toContain("Prettier");
  });
});
