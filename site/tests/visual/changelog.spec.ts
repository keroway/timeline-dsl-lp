import { expect, test } from "playwright/test";

const THEMES = [
  { name: "light", colorScheme: "light" as const, highContrast: false },
  { name: "dark", colorScheme: "dark" as const, highContrast: false },
  {
    name: "high-contrast",
    colorScheme: "light" as const,
    highContrast: true,
  },
] as const;

for (const theme of THEMES) {
  test(`Changelog (/changelog/) — ${theme.name}`, async ({ page }) => {
    // toHaveScreenshot の timeout(60000)より test 全体の timeout を長くする。
    // 既定の 30000ms だと、撮影が 30,000px 超で遅い run で screenshot の再試行中に
    // test timeout が先に発火して失敗する(#867)。
    test.setTimeout(120000);

    await page.emulateMedia({ colorScheme: theme.colorScheme });

    await page.goto("/changelog/");
    if (theme.highContrast) {
      const accent = () =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-accent")
            .trim()
        );
      const lightAccent = await accent();
      // 実装の applySettings と同じ属性で高コントラスト配色に切り替える (#853)
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-a11y-contrast", "high");
      });
      // 通常 light と同じ画像を撮らないよう、HC トークンへ切り替わったことを確認する
      await expect.poll(accent).not.toBe(lightAccent);
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
