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
