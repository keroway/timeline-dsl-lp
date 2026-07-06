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

  it("preview は本体 WASM が生成した実 SVG（.tdsl-root）を埋め込む（#428）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(HeroSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain('class="tdsl-root"');
    expect(result).toContain("tdsl-lane-band-even");
    expect(result).toContain("tdsl-event-dot");
    // 手書きモックのマークアップは完全に置き換わっている
    expect(result).not.toContain("span-block");
    expect(result).not.toContain("timeline-axis");
  });

  it("editor パネルのソースと preview は同一 heroDslExample から導出される（乖離なし）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(HeroSection, {
      props: { locale: "ja" },
    });
    // editor パネルにあるタイトル文字列が preview SVG 側にも現れる（同一ソースの証拠）
    expect(result).toContain("灰都王朝");
    expect(result).toContain("継承戦争");
  });

  it("en ロケールでも preview SVG が生成される", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(HeroSection, {
      props: { locale: "en" },
    });
    expect(result).toContain('class="tdsl-root"');
    expect(result).toContain("Haito Dynasty");
  });
});
