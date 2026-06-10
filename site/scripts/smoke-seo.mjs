import {
  DEFAULT_BASE_URL,
  assertIncludes,
  assertStatus,
  get,
  normalizeBaseUrl,
  parseArgs,
} from "./lib/smoke-helpers.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.SEO_BASE_URL ?? DEFAULT_BASE_URL);

await smokeSeo(baseUrl);

async function smokeSeo(rootUrl) {
  const hreflangTargets = [
    "/",
    "/en/",
    "/playground/",
    "/en/playground/",
    "/gallery/",
    "/en/gallery/",
    "/changelog/",
    "/en/changelog/",
    "/docs/",
    "/en/docs/",
    "/showcase/",
    "/en/showcase/",
    "/showcase/oda-nobunaga/",
    "/en/showcase/oda-nobunaga/",
    "/showcase/natsume-soseki/",
    "/en/showcase/natsume-soseki/",
    "/showcase/internet-history/",
    "/en/showcase/internet-history/",
  ];

  for (const path of hreflangTargets) {
    const res = await get(`${rootUrl}${path}`);
    assertStatus(res, path);
    const html = await res.text();
    assertIncludes(html, 'hreflang="ja"', `${path} must include hreflang=ja`);
    assertIncludes(html, 'hreflang="en"', `${path} must include hreflang=en`);
    assertIncludes(html, 'hreflang="x-default"', `${path} must include hreflang=x-default`);
  }
  console.log(`hreflang: 3 tags confirmed on ${hreflangTargets.length} pages. ✓`);

  const jsonLdTargets = [
    {
      path: "/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"SoftwareApplication"'],
    },
    {
      path: "/en/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"SoftwareApplication"'],
    },
    {
      path: "/playground/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"ItemList"',
        '"@type":"ListItem"',
      ],
    },
    {
      path: "/en/playground/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"ItemList"',
        '"@type":"ListItem"',
      ],
    },
    {
      path: "/gallery/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"ItemList"',
        '"@type":"ListItem"',
      ],
    },
    {
      path: "/en/gallery/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"ItemList"',
        '"@type":"ListItem"',
      ],
    },
    {
      path: "/showcase/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"BreadcrumbList"',
        '"@type":"CollectionPage"',
      ],
    },
    {
      path: "/en/showcase/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"BreadcrumbList"',
        '"@type":"CollectionPage"',
      ],
    },
    {
      path: "/showcase/oda-nobunaga/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    },
    {
      path: "/en/showcase/oda-nobunaga/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    },
    {
      path: "/showcase/natsume-soseki/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    },
    {
      path: "/en/showcase/natsume-soseki/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    },
    {
      path: "/showcase/internet-history/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    },
    {
      path: "/en/showcase/internet-history/",
      required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    },
    { path: "/docs/", required: ['"@type":"Organization"', '"@type":"BreadcrumbList"'] },
    { path: "/en/docs/", required: ['"@type":"Organization"', '"@type":"BreadcrumbList"'] },
    {
      path: "/changelog/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"CollectionPage"',
        '"@type":"Article"',
      ],
    },
    {
      path: "/en/changelog/",
      required: [
        '"@type":"Organization"',
        '"@type":"WebPage"',
        '"@type":"CollectionPage"',
        '"@type":"Article"',
      ],
    },
    {
      path: "/docs/faq/",
      required: [
        '"@type":"Organization"',
        '"@type":"BreadcrumbList"',
        '"@type":"FAQPage"',
        '"@type":"Question"',
      ],
    },
    {
      path: "/en/docs/faq/",
      required: [
        '"@type":"Organization"',
        '"@type":"BreadcrumbList"',
        '"@type":"FAQPage"',
        '"@type":"Question"',
      ],
    },
  ];
  for (const { path, required } of jsonLdTargets) {
    const res = await get(`${rootUrl}${path}`);
    assertStatus(res, path);
    const html = await res.text();
    const compact = html.replace(/\s+/g, "");
    for (const needle of required) {
      assertIncludes(compact, needle, `${path} must include JSON-LD ${needle}`);
    }
  }
  console.log(`JSON-LD: required @type tokens confirmed on ${jsonLdTargets.length} pages. ✓`);

  // OG 画像メタの整合（DESIGN.md §9）: type は実体に追従、width/height は 1200x630 固定。
  const ogImageTargets = [
    "/",
    "/en/",
    "/playground/",
    "/en/playground/",
    "/gallery/",
    "/en/gallery/",
    "/changelog/",
    "/en/changelog/",
  ];
  for (const path of ogImageTargets) {
    const res = await get(`${rootUrl}${path}`);
    assertStatus(res, path);
    const html = await res.text();
    assertIncludes(html, 'property="og:image"', `${path} must include og:image`);
    assertIncludes(html, 'property="og:image:type"', `${path} must include og:image:type`);
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
  }
  console.log(
    `og:image: type + 1200x630 dimensions confirmed on ${ogImageTargets.length} pages. ✓`,
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
