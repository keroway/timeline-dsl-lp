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
    { path: "/en/playground/", required: ['"@type":"Organization"', '"@type":"WebPage"'] },
    { path: "/en/gallery/", required: ['"@type":"Organization"', '"@type":"WebPage"'] },
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
