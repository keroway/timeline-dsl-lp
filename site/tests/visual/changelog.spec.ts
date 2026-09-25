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
    // このページ高では stitched fullPage capture のたびに合計高さが数px 前後し、
    // 20000ms(3回程度の再試行)では収束しないことがある(#727)。再試行回数を
    // 増やして収束を待てるよう timeout を延長する。
    await expect(page).toHaveScreenshot(`changelog-${theme.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      timeout: 60000,
    });
  });
}
