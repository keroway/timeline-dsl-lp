// 全ページ横断の WCAG 2.1 AA 自動スキャン (axe-core)。
// 既存 smoke は特定シナリオの ARIA を点検するが、これは主要ページを巡回して
// axe-core の violations=0 を assert し、色・マークアップ変更による a11y 回帰を体系的に防ぐ。
//
// ブラウザ (Chromium) が必須。preview server (既定 127.0.0.1:4321) 相手に実行する。
//   pnpm smoke:a11y
//   A11Y_BASE_URL=http://127.0.0.1:4321 pnpm smoke:a11y
//   pnpm smoke:a11y -- --base-url https://example.localhost
import { DEFAULT_BASE_URL, normalizeBaseUrl, parseArgs } from "./lib/smoke-helpers.mjs";
import { A11Y_PAGES } from "./lib/site-routes.mjs";

// WCAG 2.0/2.1 の A / AA を対象タグとする (axe-core のルールタグ)。
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// 既知の許容例外。理由を必ず添える。空配列なら例外なし。
// 形式: { page: "/path/", ruleId: "color-contrast", reason: "..." }
const ALLOWED_EXCEPTIONS = [];

const args = parseArgs(process.argv.slice(2), { booleanFlags: [] });
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.A11Y_BASE_URL ?? DEFAULT_BASE_URL);

await smokeA11y(baseUrl);
await smokeMobileNav(baseUrl);

async function smokeA11y(rootUrl) {
  const { chromium } = await importPlaywright();
  const { default: AxeBuilder } = await import("@axe-core/playwright");

  const browser = await chromium.launch();
  const failures = [];

  try {
    for (const path of A11Y_PAGES) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(`${rootUrl}${path}`, { waitUntil: "networkidle" });

        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

        const violations = results.violations.filter((violation) => !isAllowed(path, violation.id));

        if (violations.length) {
          for (const violation of violations) {
            const targets = violation.nodes
              .map((node) => node.target.join(" "))
              .slice(0, 5)
              .join(", ");
            failures.push(
              `${path} — [${violation.impact ?? "n/a"}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s): ${targets})`,
            );
          }
        } else {
          console.log(`a11y smoke: ${path} has no WCAG 2.1 AA violations. ✓`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error(`\na11y smoke: ${failures.length} WCAG 2.1 AA violation group(s) found:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    throw new Error("a11y smoke failed: axe-core reported WCAG 2.1 AA violations.");
  }

  console.log(
    `\na11y smoke: all ${A11Y_PAGES.length} pages pass WCAG 2.1 AA (axe-core ${WCAG_TAGS.join(", ")}). ✓`,
  );
  if (ALLOWED_EXCEPTIONS.length) {
    console.log(`a11y smoke: ${ALLOWED_EXCEPTIONS.length} documented exception(s) suppressed.`);
  }
}

// #432: 375px モバイルビューポートでのハンバーガーメニュー (disclosure) 検査。
// 横スクロールなしで全ナビ項目に到達でき、フォーカストラップ・Esc クローズ・
// aria-expanded の同期が壊れていないことを回帰ガードする。
async function smokeMobileNav(rootUrl) {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto(`${rootUrl}/`, { waitUntil: "networkidle" });

    const menuBtn = page.locator("#mobile-menu-btn");
    const dialog = page.locator("#mobile-nav-dialog");
    const navLinks = page.locator("#mobile-nav-dialog .mobile-nav-links a");

    // 375px 幅で横スクロールなしに到達できる: ハンバーガーボタンが可視で、
    // 旧横スクロールナビ (.nav-links) は非表示になっている。
    if (!(await menuBtn.isVisible())) {
      throw new Error("mobile nav: hamburger toggle should be visible at 375px viewport");
    }
    const navLinksDisplay = await page
      .locator(".nav-links")
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    if (navLinksDisplay !== "none") {
      throw new Error("mobile nav: desktop .nav-links should be hidden at 375px viewport");
    }

    // タッチターゲット 44x44px 相当の確保
    const box = await menuBtn.boundingBox();
    if (!box || box.width < 44 || box.height < 44) {
      throw new Error(
        `mobile nav: hamburger toggle should be at least 44x44px (got ${box?.width}x${box?.height})`,
      );
    }

    // 初期状態: aria-expanded=false, dialog は閉じている
    if ((await menuBtn.getAttribute("aria-expanded")) !== "false") {
      throw new Error("mobile nav: hamburger toggle should start with aria-expanded=false");
    }

    // 開く → aria-expanded=true, dialog が開く, 全ナビ項目が到達可能
    await menuBtn.click();
    if ((await menuBtn.getAttribute("aria-expanded")) !== "true") {
      throw new Error("mobile nav: hamburger toggle should have aria-expanded=true after click");
    }
    if (!(await dialog.isVisible())) {
      throw new Error("mobile nav: dialog should be visible after hamburger click");
    }
    const navLinkCount = await navLinks.count();
    if (navLinkCount === 0) {
      throw new Error("mobile nav: dialog should contain reachable nav links");
    }
    for (let i = 0; i < navLinkCount; i += 1) {
      if (!(await navLinks.nth(i).isVisible())) {
        throw new Error(`mobile nav: nav link at index ${i} should be reachable without scrolling`);
      }
    }

    // フォーカストラップ: ネイティブ <dialog>.showModal() は Tab を自動的に
    // ダイアログ内に閉じ込める。ダイアログ外の要素へフォーカスが漏れないことを確認する。
    const focusInsideDialog = await page.evaluate(() => {
      const dialog = document.getElementById("mobile-nav-dialog");
      return !!dialog && dialog.contains(document.activeElement);
    });
    if (!focusInsideDialog) {
      throw new Error("mobile nav: focus should be trapped inside the dialog when open");
    }

    // Escape で閉じる → aria-expanded=false, フォーカスがトグルに戻る
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    if ((await menuBtn.getAttribute("aria-expanded")) !== "false") {
      throw new Error("mobile nav: Escape should close the dialog (aria-expanded=false)");
    }
    const toggleHasFocus = await page.evaluate(
      () => document.activeElement === document.getElementById("mobile-menu-btn"),
    );
    if (!toggleHasFocus) {
      throw new Error("mobile nav: focus should return to the hamburger toggle after Escape");
    }

    console.log(
      "a11y smoke: mobile nav (375px) hamburger disclosure — focus trap / Escape close / aria-expanded all pass. ✓",
    );
    await context.close();
  } finally {
    await browser.close();
  }
}

function isAllowed(path, ruleId) {
  return ALLOWED_EXCEPTIONS.some(
    (exception) => exception.page === path && exception.ruleId === ruleId,
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (cause) {
    throw new Error(
      "Playwright module is installed but the Chromium binary is missing.\n" +
        "Run: pnpm exec playwright install chromium\n" +
        "Then rerun: pnpm smoke:a11y -- --base-url <url>",
      { cause },
    );
  }
}
