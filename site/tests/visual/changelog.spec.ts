import { expect, test } from "playwright/test";

const THEMES = [
  { name: "light", colorScheme: "light" as const, classes: [] },
  { name: "dark", colorScheme: "dark" as const, classes: [] },
  {
    name: "high-contrast",
    colorScheme: "light" as const,
    classes: ["high-contrast"],
  },
] as const;

for (const theme of THEMES) {
  test(`Changelog (/changelog/) — ${theme.name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme.colorScheme });

    if (theme.classes.length > 0) {
      await page.goto("/changelog/");
      await page.evaluate(
        (classes: string[]) => {
          document.documentElement.classList.add(...classes);
        },
        [...theme.classes]
      );
    } else {
      await page.goto("/changelog/");
    }

    await page.waitForLoadState("networkidle");

    // Changelog は全リリースノートを1ページに展開するため 30,000px 超まで伸びる。
    // 既定の 5000ms では stable screenshot の判定が間に合わないため延長する。
    await expect(page).toHaveScreenshot(`changelog-${theme.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      timeout: 20000,
    });
  });
}
