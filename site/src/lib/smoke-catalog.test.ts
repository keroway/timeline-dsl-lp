// @vitest-environment node
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  A11Y_PAGES,
  HREFLANG_PATHS,
  JSONLD_TARGETS,
} from "../../scripts/lib/site-routes.mjs";

const DIST_ROOT = join(process.cwd(), "dist");
const DOCS_ROOTS = [join(DIST_ROOT, "docs"), join(DIST_ROOT, "en", "docs")];
// 静的な index.html を生成する非 docs ルート群。`/`, `/en/` はネストしないため
// non-recursive、それ以外はスラッグを持ちうるため recursive で走査する。
// 動的 API ルート（`src/pages/og/[type].png.ts` 等、index.html を生成しないもの）は
// フィルタ条件（index.html のみ）により自然に除外される。
const TOP_LEVEL_ROOTS = [DIST_ROOT, join(DIST_ROOT, "en")];
const NESTED_STATIC_ROOTS = [
  join(DIST_ROOT, "playground"),
  join(DIST_ROOT, "en", "playground"),
  join(DIST_ROOT, "gallery"),
  join(DIST_ROOT, "en", "gallery"),
  join(DIST_ROOT, "showcase"),
  join(DIST_ROOT, "en", "showcase"),
  join(DIST_ROOT, "changelog"),
  join(DIST_ROOT, "en", "changelog"),
];

function getIndexRoutes(root: string, { recursive }: { recursive: boolean }) {
  if (!existsSync(root)) return [];

  return readdirSync(root, { encoding: "utf8", recursive })
    .filter(
      (entry) => entry.endsWith(`${sep}index.html`) || entry === "index.html"
    )
    .map((entry) => {
      const routeDirectory = dirname(join(root, entry));
      const relativePath = relative(DIST_ROOT, routeDirectory)
        .split(sep)
        .join("/");
      return relativePath ? `/${relativePath}/` : "/";
    });
}

function getBuiltDocsRoutes() {
  return DOCS_ROOTS.flatMap((root) =>
    getIndexRoutes(root, { recursive: true })
  );
}

function getBuiltNonDocsRoutes() {
  const topLevel = TOP_LEVEL_ROOTS.flatMap((root) =>
    getIndexRoutes(root, { recursive: false })
  );
  const nested = NESTED_STATIC_ROOTS.flatMap((root) =>
    getIndexRoutes(root, { recursive: true })
  );
  return [...topLevel, ...nested];
}

const hasBuildOutput = existsSync(DIST_ROOT);

// `test:unit` は build より先に走るため、dist がない通常の単体テストでは実行しない。
// `pnpm build` の最後でこのテストを再実行し、Astro が実際に生成したルートを検証する。
describe.skipIf(!hasBuildOutput)("smoke catalog site coverage", () => {
  const builtRoutes = [...getBuiltDocsRoutes(), ...getBuiltNonDocsRoutes()];
  const smokeCatalogs = [
    { name: "hreflang", paths: HREFLANG_PATHS },
    {
      name: "JSON-LD",
      paths: JSONLD_TARGETS.map((target: { path: string }) => target.path),
    },
    { name: "a11y", paths: A11Y_PAGES },
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
