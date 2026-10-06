// @vitest-environment node
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  A11Y_PAGES,
  HREFLANG_PATHS,
  JSONLD_TARGETS,
  OG_IMAGE_TARGETS,
  STARLIGHT_OG_IMAGE_TARGETS,
} from "../../scripts/lib/site-routes.mjs";

const DIST_ROOT = join(process.cwd(), "dist");

// dist 配下の相対パス一覧から、index.html を持つルートを `/foo/` 形式で返す。
// ページ種別の固定一覧に依存しないため、新しいトップレベルページも検出対象になる。
// 動的 API ルート（`src/pages/og/[type].png.ts` 等、index.html を生成しないもの）は
// フィルタ条件（index.html のみ）により自然に除外される。
function routesFromEntries(entries: string[]) {
  return entries
    .filter(
      (entry) => entry.endsWith(`${sep}index.html`) || entry === "index.html"
    )
    .map((entry) => {
      const relativePath = dirname(entry).split(sep).join("/");
      return relativePath === "." ? "/" : `/${relativePath}/`;
    });
}

function getBuiltRoutes() {
  return routesFromEntries(
    readdirSync(DIST_ROOT, { encoding: "utf8", recursive: true })
  );
}

const hasBuildOutput = existsSync(DIST_ROOT);

describe("routesFromEntries", () => {
  it("detects unknown top-level pages in both locales", () => {
    const entries = [
      "index.html",
      join("new-page", "index.html"),
      join("en", "index.html"),
      join("en", "new-page", "index.html"),
      join("og", "home.png"),
    ];

    expect(routesFromEntries(entries)).toEqual([
      "/",
      "/new-page/",
      "/en/",
      "/en/new-page/",
    ]);
  });
});

// `test:unit` は build より先に走るため、dist がない通常の単体テストでは実行しない。
// `pnpm build` の最後でこのテストを再実行し、Astro が実際に生成したルートを検証する。
describe.skipIf(!hasBuildOutput)("smoke catalog site coverage", () => {
  const builtRoutes = getBuiltRoutes();
  const smokeCatalogs = [
    { name: "hreflang", paths: HREFLANG_PATHS },
    {
      name: "JSON-LD",
      paths: JSONLD_TARGETS.map((target: { path: string }) => target.path),
    },
    { name: "a11y", paths: A11Y_PAGES },
    {
      // SocialMeta.astro（LP/Playground/Gallery/Changelog/Showcase）と Starlight
      // docs は別パイプラインのため OG_IMAGE_TARGETS / STARLIGHT_OG_IMAGE_TARGETS に
      // 分かれているが、「登録漏れ検知」の観点ではビルド済みルートがどちらか一方に
      // 登録されていれば良いので合算して突き合わせる。
      name: "OG image",
      paths: [...OG_IMAGE_TARGETS, ...STARLIGHT_OG_IMAGE_TARGETS].map(
        (target: { path: string }) => target.path
      ),
    },
  ];

  it("registers every built page in each smoke catalog", () => {
    for (const { name, paths } of smokeCatalogs) {
      const missingRoutes = builtRoutes.filter((path) => !paths.includes(path));

      expect(missingRoutes, `${name} smoke catalog is missing routes`).toEqual(
        []
      );
    }
  });
});
