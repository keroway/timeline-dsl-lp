// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SiteFooter from "./SiteFooter.astro";
import { localizedPath } from "../i18n/index";

describe("SiteFooter", () => {
  it("nav ランドマークが出力される", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain("<nav");
    expect(result).toContain('class="footer-nav"');
  });

  it("Playground / Gallery / Showcase / Changelog へのリンクを含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain('href="/playground/"');
    expect(result).toContain('href="/gallery/"');
    expect(result).toContain('href="/showcase/"');
    expect(result).toContain('href="/changelog/"');
  });

  it("主要 Docs ページ（Installation / Quick Start / Grammar / FAQ）へのリンクを含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain('href="/docs/installation/"');
    expect(result).toContain('href="/docs/quick-start/"');
    expect(result).toContain('href="/docs/grammar/"');
    expect(result).toContain('href="/docs/faq/"');
  });

  it("Project 列に License(MIT) / Releases / Contributing へのリンクを含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain("https://github.com/keroway/timeline-dsl/blob/main/LICENSE");
    expect(result).toContain("https://github.com/keroway/timeline-dsl/blob/main/CONTRIBUTING.md");
    expect(result).toContain("https://github.com/keroway/timeline-dsl/releases");
    expect(result).toContain("License (MIT)");
  });

  it("localizedPath は en ロケールで /en/ 接頭辞を付与する（SiteFooter のリンク生成と同一のヘルパを使用）", () => {
    expect(localizedPath("/docs/faq/", "en")).toBe("/en/docs/faq/");
    expect(localizedPath("/playground/", "en")).toBe("/en/playground/");
    expect(localizedPath("/playground/", "ja")).toBe("/playground/");
  });

  it("footer 要素を含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    expect(result).toContain('class="site-footer"');
  });

  it("著作権表示が現在の年を含む（ビルド時に自動更新される）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SiteFooter, {
      props: {},
    });
    const currentYear = new Date().getFullYear();
    expect(result).toContain(`2024\u2013${currentYear}`);
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
