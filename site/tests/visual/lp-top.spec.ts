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
  test(`LP top (/) — ${theme.name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme.colorScheme });

    await page.goto("/");
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

    await expect(page).toHaveScreenshot(`lp-top-${theme.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
