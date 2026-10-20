import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * pnpm のバージョン指定が package.json と CI で食い違うのを防ぐ (#746)。
 *
 * pnpm-workspace.yaml は pmOnFail: ignore のため、packageManager の値は pnpm 自身では
 * 強制されない。「packageManager と CI の version の双方で担保する」という前提を保つため、
 * 両者の一致をここで検査する。
 */

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, "../..");

describe("pnpm バージョン指定", () => {
  it("package.json の packageManager と site-build.yml の pnpm/action-setup が一致している", async () => {
    const [packageJsonRaw, workflow] = await Promise.all([
      readFile(resolve(REPO_ROOT, "site/package.json"), "utf-8"),
      readFile(resolve(REPO_ROOT, ".github/workflows/site-build.yml"), "utf-8"),
    ]);

    const pinned = JSON.parse(packageJsonRaw).packageManager.match(
      /^pnpm@(\d+\.\d+\.\d+)/
    )?.[1];
    expect(pinned, "packageManager が pnpm@x.y.z 形式ではない").toBeTruthy();

    const setupVersions = [
      ...workflow.matchAll(
        /uses:\s*pnpm\/action-setup@[^\n]*\n\s*(?:if:[^\n]*\n\s*)?with:\s*\n\s*version:\s*([^\s#]+)/g
      ),
    ].map((m) => m[1]);
    expect(
      setupVersions.length,
      "pnpm/action-setup の version が見つからない"
    ).toBeGreaterThan(0);

    for (const version of setupVersions) {
      expect(version).toBe(pinned);
    }
  });
});
