import {
  DEFAULT_BASE_URL,
  assertContentType,
  assertIncludes,
  assertStatus,
  get,
  normalizeBaseUrl,
  parseArgs,
} from "./lib/smoke-helpers.mjs";
import { ja } from "../src/i18n/ja.ts";
import { en } from "../src/i18n/en.ts";

const args = parseArgs(process.argv.slice(2), { booleanFlags: ["browser"] });
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.I18N_BASE_URL ?? DEFAULT_BASE_URL);
const runBrowserSmoke = args.browser || process.env.I18N_BROWSER_SMOKE === "1";

// Static (HTTP-independent) check first: ja / en dictionaries must share the same key set.
smokeDictionaryParity();

await smokeHttpSurface(baseUrl);

if (runBrowserSmoke) {
  await smokeBrowserFlow(baseUrl);
} else {
  console.log("Browser flow skipped. Add --browser to check language toggle behavior.");
}

function collectKeyPaths(obj, prefix, out) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      collectKeyPaths(value, path, out);
    } else {
      out.add(path);
    }
  }
}

function smokeDictionaryParity() {
  const jaKeys = new Set();
  const enKeys = new Set();
  collectKeyPaths(ja, "", jaKeys);
  collectKeyPaths(en, "", enKeys);

  const missingInEn = [...jaKeys].filter((key) => !enKeys.has(key)).sort();
  const missingInJa = [...enKeys].filter((key) => !jaKeys.has(key)).sort();

  if (missingInEn.length || missingInJa.length) {
    if (missingInEn.length) {
      console.error(`i18n parity: ${missingInEn.length} key(s) in ja.ts missing from en.ts:`);
      for (const key of missingInEn) console.error(`  - ${key}`);
    }
    if (missingInJa.length) {
      console.error(`i18n parity: ${missingInJa.length} key(s) in en.ts missing from ja.ts:`);
      for (const key of missingInJa) console.error(`  - ${key}`);
    }
    throw new Error("i18n dictionary key parity check failed (ja.ts / en.ts diverged).");
  }

  console.log(`i18n parity: ja.ts / en.ts share all ${jaKeys.size} keys. ✓`);
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

  // Showcase pages (both locales)
  const jaShowcaseRes = await get(`${rootUrl}/showcase/`);
  assertStatus(jaShowcaseRes, "/showcase/");
  assertContentType(jaShowcaseRes, "/showcase/", ["text/html"]);

  const enShowcaseRes = await get(`${rootUrl}/en/showcase/`);
  assertStatus(enShowcaseRes, "/en/showcase/");
  assertContentType(enShowcaseRes, "/en/showcase/", ["text/html"]);

  console.log("HTTP smoke: / and /en/ both return 200 with correct lang attributes. ✓");
  console.log("HTTP smoke: /showcase/ and /en/showcase/ both return 200. ✓");
}

async function smokeBrowserFlow(rootUrl) {
  const { chromium } = await importPlaywright();

  const browser = await chromium.launch();

  try {
    // Check / → lang toggle → /en/
    await checkLangToggle(browser, rootUrl, "/", "/en/", "ja → en toggle");

    // Check /en/ → lang toggle → /
    await checkLangToggle(browser, rootUrl, "/en/", "/", "en → ja toggle");

    // Check /showcase/ → lang toggle → /en/showcase/
    await checkLangToggle(browser, rootUrl, "/showcase/", "/en/showcase/", "ja showcase → en showcase toggle");

    // Check /en/showcase/ → lang toggle → /showcase/
    await checkLangToggle(browser, rootUrl, "/en/showcase/", "/showcase/", "en showcase → ja showcase toggle");
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
