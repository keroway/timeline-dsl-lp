const DEFAULT_BASE_URL = "http://127.0.0.1:4321";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.I18N_BASE_URL ?? DEFAULT_BASE_URL);
const runBrowserSmoke = args.browser || process.env.I18N_BROWSER_SMOKE === "1";

await smokeHttpSurface(baseUrl);

if (runBrowserSmoke) {
  await smokeBrowserFlow(baseUrl);
} else {
  console.log("Browser flow skipped. Add --browser to check language toggle behavior.");
}

function parseArgs(rawArgs) {
  const parsed = { browser: false, baseUrl: undefined };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--browser") {
      parsed.browser = true;
      continue;
    }

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

async function smokeHttpSurface(rootUrl) {
  // Japanese root
  const jaRes = await get(`${rootUrl}/`);
  assertStatus(jaRes, "/");
  assertContentType(jaRes, "/", ["text/html"]);

  const jaHtml = await jaRes.text();
  assertIncludes(jaHtml, 'lang="ja"', "/ must have lang=ja");
  assertIncludes(jaHtml, "Timeline DSL", "/ must include brand name");

  // English root
  const enRes = await get(`${rootUrl}/en/`);
  assertStatus(enRes, "/en/");
  assertContentType(enRes, "/en/", ["text/html"]);

  const enHtml = await enRes.text();
  assertIncludes(enHtml, 'lang="en"', "/en/ must have lang=en");
  assertIncludes(enHtml, "Timeline DSL", "/en/ must include brand name");
  assertIncludes(enHtml, "Author and validate timelines", "/en/ must include English page title");

  console.log("HTTP smoke: / and /en/ both return 200 with correct lang attributes. ✓");
}

async function smokeBrowserFlow(rootUrl) {
  const { chromium } = await importPlaywright();

  const browser = await chromium.launch();

  try {
    // Check / → lang toggle → /en/
    await checkLangToggle(browser, rootUrl, "/", "/en/", "ja → en toggle");

    // Check /en/ → lang toggle → /
    await checkLangToggle(browser, rootUrl, "/en/", "/", "en → ja toggle");
  } finally {
    await browser.close();
  }

  console.log("Browser smoke: language toggle navigation verified. ✓");
}

async function checkLangToggle(browser, rootUrl, startPath, expectedPath, label) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${rootUrl}${startPath}`);

  const langToggle = page.locator(".lang-toggle").first();
  if (!(await langToggle.count())) {
    throw new Error(`${label}: .lang-toggle button not found on ${startPath}`);
  }

  // Mock location.assign to capture navigation target without actually navigating
  await page.evaluate(() => {
    window.__langToggleTarget = null;
    Object.defineProperty(window.location, "assign", {
      value: (url) => { window.__langToggleTarget = url; },
      writable: true,
      configurable: true,
    });
  });

  await langToggle.click();

  const target = await page.evaluate(() => window.__langToggleTarget);
  if (target !== expectedPath) {
    throw new Error(`${label}: expected navigation to ${expectedPath}, got: ${target}`);
  }

  await context.close();
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (cause) {
    throw new Error(
      "Playwright module is installed but the Chromium binary is missing.\n" +
      "Run: pnpm exec playwright install chromium\n" +
      "Then rerun: pnpm smoke:i18n:browser -- --base-url <url>",
      { cause },
    );
  }
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

function assertContentType(response, label, expectedTypes) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!expectedTypes.some((t) => contentType.toLowerCase().includes(t))) {
    throw new Error(`${label} returned unexpected Content-Type: ${contentType || "(missing)"}`);
  }
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label}. Expected to find: ${expected}`);
  }
}
