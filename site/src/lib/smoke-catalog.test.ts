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

function getBuiltDocsRoutes() {
  return DOCS_ROOTS.flatMap((docsRoot) => {
    if (!existsSync(docsRoot)) return [];

    return readdirSync(docsRoot, { encoding: "utf8", recursive: true })
      .filter(
        (entry) => entry.endsWith(`${sep}index.html`) || entry === "index.html"
      )
      .map((entry) => {
        const routeDirectory = dirname(join(docsRoot, entry));
        return `/${relative(DIST_ROOT, routeDirectory).split(sep).join("/")}/`;
      });
  });
}

const hasBuildOutput = existsSync(DIST_ROOT);

// `test:unit` は build より先に走るため、dist がない通常の単体テストでは実行しない。
// `pnpm build` の最後でこのテストを再実行し、Astro が実際に生成したルートを検証する。
describe.skipIf(!hasBuildOutput)("smoke catalog docs coverage", () => {
  const builtDocsRoutes = getBuiltDocsRoutes();
  const smokeCatalogs = [
    { name: "hreflang", paths: HREFLANG_PATHS },
    {
      name: "JSON-LD",
      paths: JSONLD_TARGETS.map((target: { path: string }) => target.path),
    },
    { name: "a11y", paths: A11Y_PAGES },
  ];

  it("registers every built docs page in each smoke catalog", () => {
    for (const { name, paths } of smokeCatalogs) {
      const missingRoutes = builtDocsRoutes.filter(
        (path) => !paths.includes(path)
      );

      expect(
        missingRoutes,
        `${name} smoke catalog is missing docs routes`
      ).toEqual([]);
    }
  });
});
