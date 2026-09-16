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
  test(`Showcase (/showcase/) — ${theme.name}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme.colorScheme });

    if (theme.classes.length > 0) {
      await page.goto("/showcase/");
      await page.evaluate(
        (classes: string[]) => {
          document.documentElement.classList.add(...classes);
        },
        [...theme.classes]
      );
    } else {
      await page.goto("/showcase/");
    }

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot(`showcase-${theme.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
