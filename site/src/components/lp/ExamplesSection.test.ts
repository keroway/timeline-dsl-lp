// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ExamplesSection from "./ExamplesSection.astro";
import gallerySamples from "../../data/gallery-samples.json";

describe("ExamplesSection", () => {
  it("3 件の実レンダリング SVG（.tdsl-root）を含む（#433）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ExamplesSection, {
      props: { locale: "ja" },
    });
    expect((result.match(/class="tdsl-root"/g) ?? []).length).toBe(3);
    expect(result).toContain("timeline-embed");
  });

  it("選出したサンプルのタイトルが gallery-samples.json に実在する", async () => {
    const featuredIds = ["fictional-world", "japanese-history", "release-cycle"];
    const sampleIds = gallerySamples.map((s) => s.id);
    for (const id of featuredIds) {
      expect(sampleIds).toContain(id);
    }
  });

  it("Gallery への導線（すべてのサンプルを見る）を含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ExamplesSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain('href="/gallery/"');
  });

  it("en ロケールでは /en/gallery/ を指す", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ExamplesSection, {
      props: { locale: "en" },
    });
    expect(result).toContain('href="/en/gallery/"');
  });

  it("各サンプルから Playground への Edit リンクを含む（TimelineEmbed 組み込み）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ExamplesSection, {
      props: { locale: "ja" },
    });
    expect((result.match(/playground\/\?source=/g) ?? []).length).toBe(3);
  });
});
