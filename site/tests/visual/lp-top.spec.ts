import { test, expect } from "playwright/test";

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
  test(`LP top (/) — ${theme.name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme.colorScheme });

    if (theme.classes.length > 0) {
      await page.goto("/");
      await page.evaluate(
        (classes: string[]) => {
          document.documentElement.classList.add(...classes);
        },
        [...theme.classes],
      );
    } else {
      await page.goto("/");
    }

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot(`lp-top-${theme.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
