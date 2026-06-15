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
  // Regression guard: en LP に日本語フォールバック文言が漏れてはいけない。
  assertExcludes(enHtml, "未取得", "/en/ must not leak Japanese fallback '未取得'");
  assertExcludes(
    enHtml,
    "リリース情報は準備中です",
    "/en/ must not leak Japanese fallback 'リリース情報は準備中です'",
  );

  // Showcase pages (both locales)
  const jaShowcaseRes = await get(`${rootUrl}/showcase/`);
  assertStatus(jaShowcaseRes, "/showcase/");
  assertContentType(jaShowcaseRes, "/showcase/", ["text/html"]);

  const enShowcaseRes = await get(`${rootUrl}/en/showcase/`);
  assertStatus(enShowcaseRes, "/en/showcase/");
  assertContentType(enShowcaseRes, "/en/showcase/", ["text/html"]);

  // Gallery pages: tag filter UI と locale 別タグラベルを検証する
  const jaGalleryRes = await get(`${rootUrl}/gallery/`);
  assertStatus(jaGalleryRes, "/gallery/");
  assertContentType(jaGalleryRes, "/gallery/", ["text/html"]);
  const jaGalleryHtml = await jaGalleryRes.text();
  assertIncludes(jaGalleryHtml, 'role="group"', "/gallery/ must render the filter group");
  assertIncludes(jaGalleryHtml, "data-filter-all", "/gallery/ must render the All filter chip");
  assertIncludes(jaGalleryHtml, "data-filter-tag=", "/gallery/ must render tag filter chips");
  assertIncludes(
    jaGalleryHtml,
    "data-tags=",
    "/gallery/ cards must expose data-tags for filtering",
  );
  assertIncludes(
    jaGalleryHtml,
    "プロジェクト管理",
    "/gallery/ must show localized (ja) tag labels",
  );

  const enGalleryRes = await get(`${rootUrl}/en/gallery/`);
  assertStatus(enGalleryRes, "/en/gallery/");
  assertContentType(enGalleryRes, "/en/gallery/", ["text/html"]);
  const enGalleryHtml = await enGalleryRes.text();
  assertIncludes(enGalleryHtml, "data-filter-tag=", "/en/gallery/ must render tag filter chips");
  for (const enTag of ["History", "Project management", "Worldbuilding", "Biography"]) {
    assertIncludes(
      enGalleryHtml,
      enTag,
      `/en/gallery/ must show localized (en) tag label "${enTag}"`,
    );
  }
  // Regression guard: en ページにタグラベルの日本語が漏れてはいけない。
  // title / description / DSL source には現状日本語が残るため、それらに出現しない
  // 「タグラベル固有の語」だけをネガティブ検査対象にする。
  // 将来サンプル追加でこれらの語が title/description/source に混入すると誤検知するので、
  // その際は検査語を見直すこと。
  for (const jpTag of ["プロジェクト管理", "世界観", "伝記"]) {
    assertExcludes(
      enGalleryHtml,
      jpTag,
      `/en/gallery/ must not leak Japanese tag label "${jpTag}"`,
    );
  }
  // Regression guard: en gallery に日本語ボタン文言が漏れてはいけない。
  assertExcludes(
    enGalleryHtml,
    "この例を編集する",
    "/en/gallery/ must not leak Japanese edit button text",
  );
  // ja gallery には日本語ボタン文言が出ること。
  assertIncludes(jaGalleryHtml, "この例を編集する", "/gallery/ must show Japanese edit button text");

  // Showcase detail page: en ページに日本語 Playground リンク文言が漏れてはいけない。
  const enShowcaseDetailRes = await get(`${rootUrl}/en/showcase/oda-nobunaga/`);
  assertStatus(enShowcaseDetailRes, "/en/showcase/oda-nobunaga/");
  const enShowcaseDetailHtml = await enShowcaseDetailRes.text();
  assertExcludes(
    enShowcaseDetailHtml,
    "Playground で編集する",
    "/en/showcase/oda-nobunaga/ must not leak Japanese Playground link text",
  );

  console.log("HTTP smoke: / and /en/ both return 200 with correct lang attributes. ✓");
  console.log("HTTP smoke: /showcase/ and /en/showcase/ both return 200. ✓");
  console.log(
    "HTTP smoke: /gallery/ and /en/gallery/ expose tag filter UI with localized labels. ✓",
  );
}

// helper の汎用アサーションにないネガティブ検査（このスクリプト固有）。
function assertExcludes(value, unexpected, label) {
  if (value.includes(unexpected)) {
    throw new Error(`${label}. Expected NOT to find: ${unexpected}`);
  }
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
    await checkLangToggle(
      browser,
      rootUrl,
      "/showcase/",
      "/en/showcase/",
      "ja showcase → en showcase toggle",
    );

    // Check /en/showcase/ → lang toggle → /showcase/
    await checkLangToggle(
      browser,
      rootUrl,
      "/en/showcase/",
      "/showcase/",
      "en showcase → ja showcase toggle",
    );

    // Gallery のタグ filter トグル動作を検証する
    await checkGalleryFilter(browser, rootUrl);
  } finally {
    await browser.close();
  }

  console.log("Browser smoke: language toggle navigation verified. ✓");
  console.log("Browser smoke: gallery tag filter verified. ✓");
}

async function checkGalleryFilter(browser, rootUrl) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${rootUrl}/gallery/`);

  // filter bar は初期 hidden で、JS が有効化したときだけ表示される
  await page.locator(".gallery-filter").waitFor({ state: "visible" });

  const totalCards = await page.locator(".gallery-card").count();
  const firstChip = page.locator("[data-filter-tag]").first();
  const tagValue = await firstChip.getAttribute("data-filter-tag");
  await firstChip.click();

  if ((await firstChip.getAttribute("aria-pressed")) !== "true") {
    throw new Error("gallery filter: clicked chip did not become aria-pressed=true");
  }

  const visibleAfter = await page.locator(".gallery-card:not([hidden])").count();
  if (visibleAfter === 0 || visibleAfter >= totalCards) {
    throw new Error(
      `gallery filter: expected fewer visible cards after filtering by "${tagValue}", got ${visibleAfter}/${totalCards}`,
    );
  }

  // 「すべて」で全件に戻る
  await page.locator("[data-filter-all]").click();
  const visibleReset = await page.locator(".gallery-card:not([hidden])").count();
  if (visibleReset !== totalCards) {
    throw new Error(
      `gallery filter: All chip did not restore all cards (${visibleReset}/${totalCards})`,
    );
  }

  await context.close();
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
      value: (url) => {
        window.__langToggleTarget = url;
      },
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
