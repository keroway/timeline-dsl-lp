// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SiteFooter from "./SiteFooter.astro";

describe("SiteFooter", () => {
  it("nav ランドマークが出力される", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain("<nav");
    expect(result).toContain('class="footer-nav"');
  });

  it("Playground / Docs / Changelog へのリンクを含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain('href="/playground/"');
    expect(result).toContain('href="/docs/"');
    expect(result).toContain('href="/changelog/"');
  });

  it("footer 要素を含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain('class="site-footer"');
  });

  it("currentPath が一致するリンクに aria-current=page が付く", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: { currentPath: "/playground/" },
    });
    expect(result).toContain('aria-current="page"');
  });

  it("GitHub リンクを含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain("https://github.com/keroway/timeline-dsl");
  });
});
