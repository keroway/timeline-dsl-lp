import {
  DEFAULT_BASE_URL,
  assertContentType,
  assertIncludes,
  assertStatus,
  get,
  normalizeBaseUrl,
  parseArgs,
} from "./lib/smoke-helpers.mjs";

const PLAYGROUND_PATH = "/playground/";
const WASM_JS_PATH = "/wasm/tdsl_wasm.js";
const WASM_BINARY_PATH = "/wasm/tdsl_wasm_bg.wasm";

const VALID_SAMPLE = `timeline "Smoke" {
    title "Smoke";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

lane "Project" as project { kind custom; order 10; }

event project 2026 "Kickoff" { id "event:kickoff"; };
`;

const BROKEN_SAMPLE = `timeline "Smoke" {
    title "Smoke";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

event project 2026 "Missing lane" { id "event:broken"; };
`;

const args = parseArgs(process.argv.slice(2), { booleanFlags: ["browser"] });
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.PLAYGROUND_BASE_URL ?? DEFAULT_BASE_URL);
const runBrowserSmoke = args.browser || process.env.PLAYGROUND_BROWSER_SMOKE === "1";

await smokeHttpSurface(baseUrl);

if (runBrowserSmoke) {
  await smokeBrowserFlow(baseUrl);
} else {
  console.log("Browser flow skipped. Add --browser to check editor, diagnostics, preview recovery, and visible WASM load errors.");
}

async function smokeHttpSurface(rootUrl) {
  const playground = await get(`${rootUrl}${PLAYGROUND_PATH}`);
  assertStatus(playground, PLAYGROUND_PATH);
  assertContentType(playground, PLAYGROUND_PATH, ["text/html"]);

  const playgroundHtml = await playground.text();
  assertIncludes(playgroundHtml, "data-smoke=\"playground-editor\"", "playground editor smoke selector");
  assertIncludes(playgroundHtml, "data-smoke=\"playground-preview\"", "playground preview smoke selector");
  assertIncludes(playgroundHtml, "data-smoke=\"playground-diagnostics\"", "playground diagnostics smoke selector");
  assertIncludes(playgroundHtml, "data-copy-link", "playground copy-link button");
  assertIncludes(playgroundHtml, "data-share-live", "playground share live region");

  const wasmJs = await get(`${rootUrl}${WASM_JS_PATH}`);
  assertStatus(wasmJs, WASM_JS_PATH);
  assertContentType(wasmJs, WASM_JS_PATH, ["application/javascript", "text/javascript"]);
  assertCachePolicy(wasmJs, WASM_JS_PATH);

  const wasmBinary = await get(`${rootUrl}${WASM_BINARY_PATH}`);
  assertStatus(wasmBinary, WASM_BINARY_PATH);
  assertContentType(wasmBinary, WASM_BINARY_PATH, ["application/wasm"]);
  assertCachePolicy(wasmBinary, WASM_BINARY_PATH);

  console.log(`HTTP smoke passed: ${PLAYGROUND_PATH}, ${WASM_JS_PATH}, and ${WASM_BINARY_PATH}`);
}

async function smokeBrowserFlow(rootUrl) {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const failedWasmResponses = [];
    const page = await context.newPage();

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/wasm/") && !response.ok()) {
        failedWasmResponses.push(`${response.status()} ${url}`);
      }
    });

    await page.goto(`${rootUrl}${PLAYGROUND_PATH}`, { waitUntil: "networkidle" });
    await page.locator('[data-smoke="playground-editor"]').first().waitFor({ state: "visible" });
    await page.locator('[data-smoke="playground-preview"] svg').first().waitFor({ state: "visible" });
    await page.locator('[data-pan-zoom-stage]').first().waitFor({ state: "attached" });

    if (failedWasmResponses.length > 0) {
      throw new Error(`WASM asset request failed: ${failedWasmResponses.join(", ")}`);
    }

    const editor = page.locator('[data-smoke="playground-editor"]').first();
    const diagnostics = page.locator('[data-smoke="playground-diagnostics"]').first();

    await fillEditor(editor, BROKEN_SAMPLE);
    await diagnostics.waitFor({ state: "visible" });
    await page.waitForFunction(
      () => /error|エラー/i.test(document.querySelector('[data-smoke="playground-diagnostics"]')?.textContent ?? ""),
      undefined,
      { timeout: 5000 },
    );

    await fillEditor(editor, VALID_SAMPLE);
    await page.locator('[data-smoke="playground-preview"] svg').first().waitFor({ state: "visible" });

    await context.close();
    await smokeVisibleWasmFailure(rootUrl, browser);
    await smokeA11yMenu(rootUrl, browser);
    await smokeLocaleToggle(rootUrl, browser);
  } finally {
    await browser.close();
  }

  console.log("Browser smoke passed: editor diagnostics, SVG preview recovery, visible WASM load failure, a11y menu, and locale toggle.");
}

async function smokeA11yMenu(rootUrl, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${rootUrl}${PLAYGROUND_PATH}`, { waitUntil: "networkidle" });

  const toggle = page.locator(".a11y-toggle").first();
  const menu = page.locator("#a11y-menu").first();

  // メニューが初期状態で非表示
  if (await toggle.getAttribute("aria-expanded") !== "false") {
    throw new Error("a11y toggle should start with aria-expanded=false");
  }

  // メニューを開く → aria-expanded=true
  await toggle.click();
  if (await toggle.getAttribute("aria-expanded") !== "true") {
    throw new Error("a11y toggle should have aria-expanded=true after click");
  }
  if (await menu.isHidden()) {
    throw new Error("a11y menu should be visible after toggle click");
  }

  // 開いた直後に先頭 focusable (動きを抑えるチェックボックス) にフォーカス
  const firstFocusable = menu.locator("input, select").first();
  await firstFocusable.waitFor({ state: "visible" });
  const hasFocus = await page.evaluate(() => {
    const menu = document.getElementById("a11y-menu");
    const first = menu?.querySelector("input, select");
    return document.activeElement === first;
  });
  if (!hasFocus) {
    throw new Error("First focusable in a11y menu should receive focus on open");
  }

  // Escape キーでメニューが閉じる
  await page.keyboard.press("Escape");
  if (await toggle.getAttribute("aria-expanded") !== "false") {
    throw new Error("Escape should close a11y menu (aria-expanded=false)");
  }
  if (await menu.isVisible()) {
    throw new Error("a11y menu should be hidden after Escape");
  }

  // フォーカスがトグルに戻る
  const toggleHasFocus = await page.evaluate(() => {
    return document.activeElement === document.querySelector(".a11y-toggle");
  });
  if (!toggleHasFocus) {
    throw new Error("Focus should return to toggle after Escape");
  }

  // 設定変更の永続化: 高コントラスト ON → localStorage + html 属性反映
  await toggle.click();
  const highContrastCb = menu.locator("[data-a11y-high-contrast]").first();
  await highContrastCb.check();
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("tdsl-a11y-settings");
    return raw ? JSON.parse(raw) : null;
  });
  if (!stored?.highContrast) {
    throw new Error("highContrast should be persisted to localStorage");
  }
  const htmlAttr = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-contrast"));
  if (htmlAttr !== "high") {
    throw new Error("data-a11y-contrast=high should be set on html element");
  }

  // 回帰防止 (#218): high-contrast で accent-strong と sky lane が同色衝突しないこと
  const hcTokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      accentStrong: cs.getPropertyValue("--color-accent-strong").trim(),
      sky: cs.getPropertyValue("--color-sky").trim(),
    };
  });
  if (hcTokens.accentStrong === hcTokens.sky) {
    throw new Error(
      `high-contrast: --color-accent-strong と --color-sky が同色 (${hcTokens.sky}) — lane の区別がつかない`,
    );
  }

  // 回帰防止 (#219): high-contrast で terminal の bg/ink が区別でき、
  // diagnostic の ok/warn/error が相互に異なる（色相分離が潰れていない）こと
  const hcTerminal = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const read = (name) => cs.getPropertyValue(name).trim();
    return {
      bg: read("--color-terminal-bg"),
      ink: read("--color-terminal-ink"),
      ok: read("--color-terminal-ok"),
      warn: read("--color-terminal-warn"),
      error: read("--color-terminal-error"),
    };
  });
  if (hcTerminal.bg === hcTerminal.ink) {
    throw new Error(
      `high-contrast: --color-terminal-bg と --color-terminal-ink が同色 (${hcTerminal.bg}) — terminal 上のテキストが読めない`,
    );
  }
  const diagColors = [hcTerminal.ok, hcTerminal.warn, hcTerminal.error];
  if (new Set(diagColors).size !== diagColors.length) {
    throw new Error(
      `high-contrast: diagnostic の ok/warn/error が相互に区別できない (${diagColors.join(", ")})`,
    );
  }

  // テキストスペーシング ON → html 属性反映
  const textSpacingCb = menu.locator("[data-a11y-text-spacing-input]").first();
  await textSpacingCb.check();
  const spacingAttr = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-text-spacing"));
  if (spacingAttr !== "enhanced") {
    throw new Error("data-a11y-text-spacing=enhanced should be set on html element");
  }

  // 200% 文字サイズ → html 属性反映
  const textSizeSelect = menu.locator("[data-a11y-text-size]").first();
  await textSizeSelect.selectOption("xx-large");
  const sizeAttr = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-text-size"));
  if (sizeAttr !== "xx-large") {
    throw new Error("data-a11y-text-size=xx-large should be set on html element");
  }

  // 旧スキーマ (textSpacing なし) のマイグレーション
  await page.evaluate(() => {
    localStorage.setItem("tdsl-a11y-settings", JSON.stringify({
      reducedMotion: false,
      highContrast: true,
      textSize: "large",
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  const migratedAttr = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-contrast"));
  if (migratedAttr !== "high") {
    throw new Error("Legacy schema (without textSpacing) should migrate and apply highContrast");
  }
  const migratedSize = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-text-size"));
  if (migratedSize !== "large") {
    throw new Error("Legacy schema (without textSpacing) should migrate and apply textSize=large");
  }

  // cleanup
  await page.evaluate(() => localStorage.removeItem("tdsl-a11y-settings"));
  await context.close();
}

async function smokeVisibleWasmFailure(rootUrl, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/wasm/tdsl_wasm*", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "text/plain",
      body: "smoke: forced wasm asset failure",
    });
  });

  await page.goto(`${rootUrl}${PLAYGROUND_PATH}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => /WASM|読み込めません|load|failed|error|エラー/i.test(document.body.textContent ?? ""),
    undefined,
    { timeout: 5000 },
  );

  await context.close();
}

async function smokeLocaleToggle(rootUrl, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${rootUrl}${PLAYGROUND_PATH}`, { waitUntil: "networkidle" });

  const langToggle = page.locator(".lang-toggle").first();

  // lang-toggle ボタンが表示されていること
  if (await langToggle.isHidden()) {
    throw new Error("lang-toggle button should be visible on playground page");
  }

  // キーボードアクセシビリティ: Tab で到達できること
  const isTabReachable = await page.evaluate(() => {
    const el = document.querySelector(".lang-toggle");
    return el instanceof HTMLButtonElement && !el.disabled;
  });
  if (!isTabReachable) {
    throw new Error("lang-toggle should be a non-disabled button (keyboard accessible)");
  }

  // aria-label が設定されていること
  const ariaLabel = await langToggle.getAttribute("aria-label");
  if (!ariaLabel) {
    throw new Error("lang-toggle should have an aria-label attribute");
  }

  // クリック時に localStorage へ tdsl-locale が保存されること（実際の遷移はテスト外）
  await page.evaluate(() => localStorage.removeItem("tdsl-locale"));

  // クリック前に location.assign をモックして遷移を防ぐ
  await page.evaluate(() => {
    window.__langToggleTarget = null;
    const orig = window.location.assign.bind(window.location);
    window.__origAssign = orig;
    Object.defineProperty(window.location, "assign", {
      value: (url) => { window.__langToggleTarget = url; },
      writable: true,
      configurable: true,
    });
  });

  await langToggle.click();

  // localStorage に tdsl-locale が保存されること
  const stored = await page.evaluate(() => localStorage.getItem("tdsl-locale"));
  if (!stored) {
    throw new Error("lang-toggle click should save tdsl-locale to localStorage");
  }

  // /playground/ は英語版が未提供なので /en/ に遷移すること
  const target = await page.evaluate(() => window.__langToggleTarget);
  if (target !== "/en/") {
    throw new Error(`lang-toggle from /playground/ should redirect to /en/, got: ${target}`);
  }

  // aria-live で未提供メッセージが通知されること
  const liveText = await page.evaluate(() => {
    return document.querySelector("[data-a11y-live]")?.textContent ?? "";
  });
  if (!liveText) {
    throw new Error("lang-toggle should announce unavailability via [data-a11y-live]");
  }

  // cleanup
  await page.evaluate(() => localStorage.removeItem("tdsl-locale"));
  await context.close();
}

async function fillEditor(locator, value) {
  const input = locator.locator('[data-smoke="playground-editor-input"]').first();
  await input.fill(value);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (cause) {
    throw new Error(
      "Playwright module is installed but the Chromium binary is missing.\n" +
      "Run: pnpm exec playwright install chromium\n" +
      "Then rerun: pnpm smoke:playground:browser -- --base-url <url>",
      { cause },
    );
  }
}

function assertCachePolicy(response, label) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAgeMatch = /(?:^|,\s*)max-age=(\d+)/i.exec(cacheControl);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;

  if (/immutable/i.test(cacheControl) || maxAge > 3600) {
    throw new Error(`${label} uses an aggressive cache policy for an unversioned WASM asset: ${cacheControl}`);
  }
}
