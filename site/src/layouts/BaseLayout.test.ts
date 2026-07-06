// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import BaseLayout from "./BaseLayout.astro";

describe("BaseLayout", () => {
  it("head に starlight-theme / data-theme の FOUC 防止 inline script を含む（#431）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(BaseLayout, {
      props: {
        title: "Test",
        description: "desc",
        pathname: "/",
      },
      slots: {
        default: '<main id="main-content">body</main>',
      },
    });
    expect(result).toContain("starlight-theme");
    expect(result).toContain("document.documentElement.dataset.theme");
    expect(result).toContain('matchMedia("(prefers-color-scheme: light)")');
  });
});
