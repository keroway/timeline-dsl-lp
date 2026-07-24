import { en } from "../src/i18n/en.ts";
import { ja } from "../src/i18n/ja.ts";
import {
  assertContentType,
  assertIncludes,
  assertStatus,
  captureNavigationTarget,
  DEFAULT_BASE_URL,
  get,
  normalizeBaseUrl,
  parseArgs,
} from "./lib/smoke-helpers.mjs";

const args = parseArgs(process.argv.slice(2), { booleanFlags: ["browser"] });
const baseUrl = normalizeBaseUrl(
  args.baseUrl ?? process.env.I18N_BASE_URL ?? DEFAULT_BASE_URL
);
const runBrowserSmoke = args.browser || process.env.I18N_BROWSER_SMOKE === "1";

// Static (HTTP-independent) check first: ja / en dictionaries must share the same key set.
smokeDictionaryParity();

await smokeHttpSurface(baseUrl);

if (runBrowserSmoke) {
  await smokeBrowserFlow(baseUrl);
} else {
  console.log(
    "Browser flow skipped. Add --browser to check language toggle behavior."
  );
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
      console.error(
        `i18n parity: ${missingInEn.length} key(s) in ja.ts missing from en.ts:`
      );
      for (const key of missingInEn) console.error(`  - ${key}`);
    }
    if (missingInJa.length) {
      console.error(
        `i18n parity: ${missingInJa.length} key(s) in en.ts missing from ja.ts:`
      );
      for (const key of missingInJa) console.error(`  - ${key}`);
    }
    throw new Error(
      "i18n dictionary key parity check failed (ja.ts / en.ts diverged)."
    );
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
  assertIncludes(
    enHtml,
    "Author and validate timelines",
    "/en/ must include English page title"
  );
  // Regression guard: en LP に日本語フォールバック文言が漏れてはいけない。
  assertExcludes(
    enHtml,
    "未取得",
    "/en/ must not leak Japanese fallback '未取得'"
  );
  assertExcludes(
    enHtml,
    "リリース情報は準備中です",
    "/en/ must not leak Japanese fallback 'リリース情報は準備中です'"
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
  assertIncludes(
    jaGalleryHtml,
    'role="group"',
    "/gallery/ must render the filter group"
  );
  assertIncludes(
    jaGalleryHtml,
    "data-filter-all",
    "/gallery/ must render the All filter chip"
  );
  assertIncludes(
    jaGalleryHtml,
    "data-filter-tag=",
    "/gallery/ must render tag filter chips"
  );
  assertIncludes(
    jaGalleryHtml,
    "data-tags=",
    "/gallery/ cards must expose data-tags for filtering"
  );
  // ja タグラベル全件確認（gallery-samples.json に存在するすべてのキーを検証）
  for (const jaTag of [
    "歴史",
    "年表",
    "プロジェクト管理",
    "ロードマップ",
    "創作",
    "世界観",
    "OSS",
    "伝記",
  ]) {
    assertIncludes(
      jaGalleryHtml,
      jaTag,
      `/gallery/ must show localized (ja) tag label "${jaTag}"`
    );
  }

  const enGalleryRes = await get(`${rootUrl}/en/gallery/`);
  assertStatus(enGalleryRes, "/en/gallery/");
  assertContentType(enGalleryRes, "/en/gallery/", ["text/html"]);
  const enGalleryHtml = await enGalleryRes.text();
  assertIncludes(
    enGalleryHtml,
    "data-filter-tag=",
    "/en/gallery/ must render tag filter chips"
  );
  // en タグラベル全件確認（gallery-samples.json に存在するすべてのキーを検証）
  for (const enTag of [
    "History",
    "Chronology",
    "Project management",
    "Roadmap",
    "Creative",
    "Worldbuilding",
    "OSS",
    "Biography",
  ]) {
    assertIncludes(
      enGalleryHtml,
      enTag,
      `/en/gallery/ must show localized (en) tag label "${enTag}"`
    );
  }
  // Regression guard: en ページにタグラベルの日本語が漏れてはいけない。
  // DSL source には現状日本語が残るため、そこに出現しない「タグラベル固有の語」だけを
  // ネガティブ検査対象にする。将来サンプル追加でこれらの語が source に混入すると
  // 誤検知するので、その際は検査語を見直すこと。
  for (const jpTag of ["プロジェクト管理", "世界観", "伝記"]) {
    assertExcludes(
      enGalleryHtml,
      jpTag,
      `/en/gallery/ must not leak Japanese tag label "${jpTag}"`
    );
  }

  // Regression guard (#484): en gallery の作例タイトル・説明文は英語でなければならない。
  const GALLERY_SAMPLE_LOCALES = [
    {
      ja: {
        title: "日本近現代史",
        description: "幕末から大正時代までの主要な政治",
      },
      en: {
        title: "Modern Japanese History",
        description: "late Edo period through the Taisho",
      },
    },
    {
      ja: {
        title: "ソフトウェア開発ロードマップ",
        description: "フェーズと節目を span",
      },
      en: {
        title: "Software Development Roadmap",
        description: "expressing phases and milestones",
      },
    },
    {
      ja: {
        title: "架空世界年表",
        description: "王朝・事件・人物を 3 つの lane",
      },
      en: {
        title: "Fictional World Chronicle",
        description: "dynasties, incidents, and people",
      },
    },
    {
      ja: {
        title: "ライブラリ リリースサイクル",
        description: "メジャー・マイナーバージョン",
      },
      en: {
        title: "Library Release Cycle",
        description: "major/minor versions and LTS periods",
      },
    },
    {
      ja: { title: "人物年表", description: "出生から没年まで" },
      en: {
        title: "Biographical Timeline",
        description: "from birth to death, using event",
      },
    },
  ];
  for (const sample of GALLERY_SAMPLE_LOCALES) {
    assertIncludes(
      enGalleryHtml,
      sample.en.title,
      `/en/gallery/ must show English sample title "${sample.en.title}"`
    );
    assertIncludes(
      enGalleryHtml,
      sample.en.description,
      `/en/gallery/ must show English sample description "${sample.en.description}"`
    );
    // 注意: title は DSL source(`timeline "..."` ヘッダ)に同一の日本語文字列が
    // 意図的に残るサンプルがある(source はスコープ外)ため、title のリーク検査は
    // description のみに限定する。
    assertExcludes(
      enGalleryHtml,
      sample.ja.description,
      `/en/gallery/ must not leak Japanese sample description "${sample.ja.description}"`
    );
    assertIncludes(
      jaGalleryHtml,
      sample.ja.title,
      `/gallery/ must still show Japanese sample title "${sample.ja.title}"`
    );
  }
  // Regression guard: en gallery に日本語ボタン文言が漏れてはいけない。
  assertExcludes(
    enGalleryHtml,
    "この例を編集する",
    "/en/gallery/ must not leak Japanese edit button text"
  );
  // ja gallery には日本語ボタン文言が出ること。
  assertIncludes(
    jaGalleryHtml,
    "この例を編集する",
    "/gallery/ must show Japanese edit button text"
  );

  // Showcase detail page: en ページに日本語 Playground リンク文言が漏れてはいけない。
  const enShowcaseDetailRes = await get(`${rootUrl}/en/showcase/oda-nobunaga/`);
  assertStatus(enShowcaseDetailRes, "/en/showcase/oda-nobunaga/");
  const enShowcaseDetailHtml = await enShowcaseDetailRes.text();
  assertExcludes(
    enShowcaseDetailHtml,
    "Playground で編集する",
    "/en/showcase/oda-nobunaga/ must not leak Japanese Playground link text"
  );
  // TimelineEmbed の可視文言（<summary> / エラー文言）が /en/ に漏れてはいけない。#403
  assertExcludes(
    enShowcaseDetailHtml,
    "DSL ソースを見る",
    "/en/showcase/oda-nobunaga/ must not leak Japanese TimelineEmbed view-source label"
  );
  assertExcludes(
    enShowcaseDetailHtml,
    "年表の生成に失敗しました",
    "/en/showcase/oda-nobunaga/ must not leak Japanese TimelineEmbed render-error label"
  );

  console.log(
    "HTTP smoke: / and /en/ both return 200 with correct lang attributes. ✓"
  );
  console.log("HTTP smoke: /showcase/ and /en/showcase/ both return 200. ✓");
  console.log(
    "HTTP smoke: /gallery/ and /en/gallery/ expose tag filter UI with localized labels. ✓"
  );

  // Regression guard (#426): en ページの header nav / footer リンクは /en/ 配下
  // （外部リンクを除く）を指さなければならない。
  assertLocaleScopedLinks(enHtml, "/en/");
  console.log(
    "HTTP smoke: /en/ header nav and footer links stay within /en/. ✓"
  );
}

// header <nav class="nav"> と footer <footer class="site-footer"> 内の href を抽出し、
// 外部リンク（http(s)://）を除いた内部リンクがすべて指定 prefix 配下であることを検証する。
function assertLocaleScopedLinks(html, expectedPrefix) {
  const navMatch = html.match(/<nav class="nav[^"]*"[\s\S]*?<\/nav>/);
  const footerMatch = html.match(
    /<footer class="site-footer[^"]*"[\s\S]*?<\/footer>/
  );
  const brandMatch = html.match(/<a class="brand[^"]*"[^>]*href="([^"]*)"/);

  if (!navMatch)
    throw new Error(
      'assertLocaleScopedLinks: <nav class="nav"> block not found'
    );
  if (!footerMatch)
    throw new Error(
      'assertLocaleScopedLinks: <footer class="site-footer"> block not found'
    );
  if (!brandMatch)
    throw new Error("assertLocaleScopedLinks: brand link (a.brand) not found");

  if (!brandMatch[1].startsWith(expectedPrefix)) {
    throw new Error(
      `assertLocaleScopedLinks: brand link "${brandMatch[1]}" does not start with "${expectedPrefix}"`
    );
  }

  for (const [label, block] of [
    ["header nav", navMatch[0]],
    ["footer", footerMatch[0]],
  ]) {
    const hrefs = [...block.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    if (hrefs.length === 0) {
      throw new Error(
        `assertLocaleScopedLinks: no href found in ${label} block`
      );
    }
    for (const href of hrefs) {
      if (href.startsWith("http://") || href.startsWith("https://")) continue;
      if (!href.startsWith(expectedPrefix)) {
        throw new Error(
          `assertLocaleScopedLinks: ${label} link "${href}" does not start with "${expectedPrefix}"`
        );
      }
    }
  }
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
      "ja showcase → en showcase toggle"
    );

    // Check /en/showcase/ → lang toggle → /showcase/
    await checkLangToggle(
      browser,
      rootUrl,
      "/en/showcase/",
      "/showcase/",
      "en showcase → ja showcase toggle"
    );

    // Gallery のタグ filter トグル動作を検証する
    await checkGalleryFilter(browser, rootUrl);

    // サイト内検索(Pagefind UI)が LP / Docs 双方で初期化され結果を返すことを検証する(#482)
    await checkSearch(
      browser,
      rootUrl,
      "/",
      "site-search-btn",
      "site-search-ui",
      "LP search"
    );
    await checkSearch(
      browser,
      rootUrl,
      "/docs/",
      "docs-search-btn",
      "docs-search-ui",
      "Docs search"
    );
  } finally {
    await browser.close();
  }

  console.log("Browser smoke: language toggle navigation verified. ✓");
  console.log("Browser smoke: gallery tag filter verified. ✓");
  console.log("Browser smoke: site search (LP / Docs) verified. ✓");
}

async function checkSearch(browser, rootUrl, path, buttonId, uiId, label) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${rootUrl}${path}`);
  await page.locator(`#${buttonId}`).click();

  const searchUi = page.locator(`#${uiId}`);
  const notBuiltMessage = await searchUi.getAttribute("data-not-built-msg");
  await page
    .locator(`#${uiId} .pagefind-ui__search-input`)
    .waitFor({ state: "visible" });

  const uiText = await searchUi.textContent();
  if (notBuiltMessage && uiText?.includes(notBuiltMessage)) {
    throw new Error(
      `${label}: PagefindUI failed to initialize (fallback message shown)`
    );
  }

  await page.locator(`#${uiId} .pagefind-ui__search-input`).fill("install");
  await page
    .locator(`#${uiId} .pagefind-ui__result`)
    .first()
    .waitFor({ state: "visible", timeout: 5000 });

  await context.close();
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
    throw new Error(
      "gallery filter: clicked chip did not become aria-pressed=true"
    );
  }

  const visibleAfter = await page
    .locator(".gallery-card:not([hidden])")
    .count();
  if (visibleAfter === 0 || visibleAfter >= totalCards) {
    throw new Error(
      `gallery filter: expected fewer visible cards after filtering by "${tagValue}", got ${visibleAfter}/${totalCards}`
    );
  }

  // 「すべて」で全件に戻る
  await page.locator("[data-filter-all]").click();
  const visibleReset = await page
    .locator(".gallery-card:not([hidden])")
    .count();
  if (visibleReset !== totalCards) {
    throw new Error(
      `gallery filter: All chip did not restore all cards (${visibleReset}/${totalCards})`
    );
  }

  await context.close();
}

async function checkLangToggle(
  browser,
  rootUrl,
  startPath,
  expectedPath,
  label
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${rootUrl}${startPath}`);

  const langToggle = page.locator(".lang-toggle").first();
  if (!(await langToggle.count())) {
    throw new Error(`${label}: .lang-toggle button not found on ${startPath}`);
  }

  // location.assign を直接書き換えず、ナビゲーションリクエストをネットワークレベルで捕捉する（#456）
  const target = await captureNavigationTarget(page, () => langToggle.click());
  if (target !== expectedPath) {
    throw new Error(
      `${label}: expected navigation to ${expectedPath}, got: ${target}`
    );
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
      { cause }
    );
  }
}
