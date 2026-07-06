// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SiteHeader from "./SiteHeader.astro";

describe("SiteHeader", () => {
  it("theme select（auto / light / dark）を nav-utilities に含む（#431）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteHeader, {
      props: { currentPath: "/" },
    });
    expect(result).toContain("data-theme-select");
    expect(result).toContain('option value="auto"');
    expect(result).toContain('option value="light"');
    expect(result).toContain('option value="dark"');
  });

  it("モバイル用 utilities slot を引き続き保持する（theme select も同 slot を移動可能）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteHeader, {
      props: { currentPath: "/" },
    });
    expect(result).toContain('id="nav-utilities-slot"');
    expect(result).toContain('id="mobile-nav-utilities-slot"');
  });
});
