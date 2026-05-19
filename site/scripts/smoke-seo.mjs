const DEFAULT_BASE_URL = "http://127.0.0.1:4321";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.SEO_BASE_URL ?? DEFAULT_BASE_URL);

await smokeSeo(baseUrl);

function parseArgs(rawArgs) {
  const parsed = { baseUrl: undefined };
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--base-url") {
      parsed.baseUrl = rawArgs[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      parsed.baseUrl = arg.slice("--base-url=".length);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  if (!value) return DEFAULT_BASE_URL;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function smokeSeo(rootUrl) {
  const hreflangTargets = [
    "/",
    "/en/",
    "/playground/",
    "/gallery/",
    "/changelog/",
    "/showcase/",
    "/showcase/oda-nobunaga/",
    "/showcase/natsume-soseki/",
    "/docs/",
    "/en/docs/",
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
    { path: "/", required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"SoftwareApplication"'] },
    { path: "/en/", required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"SoftwareApplication"'] },
    { path: "/showcase/", required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"', '"@type":"CollectionPage"'] },
    { path: "/showcase/oda-nobunaga/", required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'] },
    { path: "/showcase/natsume-soseki/", required: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'] },
    { path: "/docs/", required: ['"@type":"Organization"', '"@type":"BreadcrumbList"'] },
    { path: "/en/docs/", required: ['"@type":"Organization"', '"@type":"BreadcrumbList"'] },
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
  assertIncludes(robotsBody, "sitemap-index.xml", "robots.txt Sitemap must point to sitemap-index.xml");
  console.log("robots.txt: served with User-agent / Sitemap entries. ✓");
}

async function get(url) {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${url} redirected with ${response.status}; smoke expects a directly served page.`);
  }
  return response;
}

function assertStatus(response, label) {
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label}. Expected to find: ${expected}`);
  }
}
