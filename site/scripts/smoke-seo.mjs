import {
  DEFAULT_BASE_URL,
  assertIncludes,
  assertStatus,
  get,
  normalizeBaseUrl,
  parseArgs,
} from "./lib/smoke-helpers.mjs";
import {
  HREFLANG_PATHS,
  JSONLD_TARGETS,
  OG_IMAGE_TARGETS,
} from "./lib/site-routes.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.SEO_BASE_URL ?? DEFAULT_BASE_URL);

await smokeSeo(baseUrl);

async function smokeSeo(rootUrl) {
  for (const path of HREFLANG_PATHS) {
    const res = await get(`${rootUrl}${path}`);
    assertStatus(res, path);
    const html = await res.text();
    assertIncludes(html, 'hreflang="ja"', `${path} must include hreflang=ja`);
    assertIncludes(html, 'hreflang="en"', `${path} must include hreflang=en`);
    assertIncludes(html, 'hreflang="x-default"', `${path} must include hreflang=x-default`);
  }
  console.log(`hreflang: 3 tags confirmed on ${HREFLANG_PATHS.length} pages. ✓`);

  for (const { path, required } of JSONLD_TARGETS) {
    const res = await get(`${rootUrl}${path}`);
    assertStatus(res, path);
    const html = await res.text();
    const compact = html.replace(/\s+/g, "");
    for (const needle of required) {
      assertIncludes(compact, needle, `${path} must include JSON-LD ${needle}`);
    }
  }
  console.log(`JSON-LD: required @type tokens confirmed on ${JSONLD_TARGETS.length} pages. ✓`);

  // OG 画像メタの整合（DESIGN.md §9）: ページ種別ごとに専用 PNG を参照し（#308/#309）、
  // type は実体（PNG）に追従、width/height は 1200x630 固定。ja/en は同一種別で同じ画像。
  for (const { path, image } of OG_IMAGE_TARGETS) {
    const res = await get(`${rootUrl}${path}`);
    assertStatus(res, path);
    const html = await res.text();
    // og:image の content は Astro.site（本番 origin）で出力されるため、preview origin に
    // 依存しないようパス部分の一致で検証する（origin 結合を避ける）。
    assertIncludes(html, 'property="og:image"', `${path} must include og:image`);
    assertIncludes(html, `${image}"`, `${path} og:image must reference ${image}`);
    assertIncludes(
      html,
      'property="og:image:type" content="image/png"',
      `${path} must declare og:image:type=image/png`,
    );
    assertIncludes(
      html,
      'property="og:image:width" content="1200"',
      `${path} must include og:image:width=1200`,
    );
    assertIncludes(
      html,
      'property="og:image:height" content="630"',
      `${path} must include og:image:height=630`,
    );
    // 参照先 PNG が実際に 200 / image/png で配信されることも確認する。
    const imageRes = await get(`${rootUrl}${image}`);
    assertStatus(imageRes, image);
    const contentType = imageRes.headers.get("content-type") ?? "";
    if (!contentType.includes("image/png")) {
      throw new Error(`${image} must be served as image/png (got "${contentType}")`);
    }
  }
  console.log(
    `og:image: per-page PNG + type + 1200x630 dimensions confirmed on ${OG_IMAGE_TARGETS.length} pages. ✓`,
  );

  const robotsRes = await get(`${rootUrl}/robots.txt`);
  assertStatus(robotsRes, "/robots.txt");
  const robotsBody = await robotsRes.text();
  assertIncludes(robotsBody, "User-agent: *", "robots.txt must list User-agent: *");
  assertIncludes(robotsBody, "Sitemap:", "robots.txt must include a Sitemap line");
  assertIncludes(
    robotsBody,
    "sitemap-index.xml",
    "robots.txt Sitemap must point to sitemap-index.xml",
  );
  console.log("robots.txt: served with User-agent / Sitemap entries. ✓");
}
