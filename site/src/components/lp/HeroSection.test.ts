// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import HeroSection from "./HeroSection.astro";

describe("HeroSection", () => {
  it("CTA は primary 1 つ + secondary 1 つに絞られている（#434）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(HeroSection, {
      props: { locale: "ja" },
    });
    const primaryCount = (result.match(/button-primary/g) ?? []).length;
    const secondaryCount = (result.match(/button-secondary/g) ?? []).length;
    expect(primaryCount).toBe(1);
    expect(secondaryCount).toBe(1);
  });

  it("GitHub への導線は信頼バー（trust-bar）に残る", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(HeroSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain("https://github.com/keroway/timeline-dsl");
    expect(result).toContain("trust-bar");
  });
});
