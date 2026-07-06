// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ClosingCtaSection from "./ClosingCtaSection.astro";

describe("ClosingCtaSection", () => {
  it("Playground (primary) と Docs (secondary) への CTA を含む（ja）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ClosingCtaSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain('href="/playground/"');
    expect(result).toContain('href="/docs/"');
    expect(result).toContain("button-primary");
    expect(result).toContain("button-secondary");
  });

  it("en ロケールでは /en/ プレフィックス付きリンクを出力する", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ClosingCtaSection, {
      props: { locale: "en" },
    });
    expect(result).toContain('href="/en/playground/"');
    expect(result).toContain('href="/en/docs/"');
  });

  it("見出し・リード文の a11y ランドマーク（aria-labelledby）を持つ", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ClosingCtaSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain('aria-labelledby="closing-cta-heading"');
    expect(result).toContain('id="closing-cta-heading"');
  });
});
