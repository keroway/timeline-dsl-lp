// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SocialMeta from "./SocialMeta.astro";

describe("SocialMeta", () => {
  it("og:title と og:description を出力する", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SocialMeta, {
      props: {
        title: "テストタイトル",
        description: "テスト説明文",
        pathname: "/test/",
      },
    });
    expect(result).toContain('content="テストタイトル"');
    expect(result).toContain('content="テスト説明文"');
  });

  it("ja ロケールで og:locale が ja_JP になる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SocialMeta, {
      props: {
        title: "タイトル",
        description: "説明",
        pathname: "/",
        locale: "ja",
      },
    });
    expect(result).toContain('content="ja_JP"');
  });

  it("en ロケールで og:locale が en_US になる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SocialMeta, {
      props: {
        title: "Title",
        description: "Description",
        pathname: "/en/",
        locale: "en",
      },
    });
    expect(result).toContain('content="en_US"');
  });

  it("og:image:type に png の MIME タイプが付く", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SocialMeta, {
      props: {
        title: "タイトル",
        description: "説明",
        pathname: "/",
        imagePath: "/og/default.png",
      },
    });
    expect(result).toContain('content="image/png"');
  });

  it("og:image:width と og:image:height が 1200x630 固定になる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SocialMeta, {
      props: {
        title: "タイトル",
        description: "説明",
        pathname: "/",
      },
    });
    expect(result).toContain('content="1200"');
    expect(result).toContain('content="630"');
  });

  it("twitter:card が summary_large_image になる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SocialMeta, {
      props: {
        title: "タイトル",
        description: "説明",
        pathname: "/",
      },
    });
    expect(result).toContain('content="summary_large_image"');
  });
});
