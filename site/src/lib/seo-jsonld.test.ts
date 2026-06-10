// @vitest-environment node
// seo-jsonld.ts はブラウザ API に依存しない純粋関数群なので node 環境で検証する。
import { describe, expect, it } from "vitest";
import {
  breadcrumbLd,
  changelogLd,
  faqPageLd,
  graphLd,
  itemListLd,
  organizationLd,
  softwareApplicationLd,
  webPageLd,
  type ChangelogRelease,
} from "./seo-jsonld";

const SITE_URL = new URL("https://timeline-dsl.pages.dev/");

describe("organizationLd", () => {
  it("Organization スキーマの必須フィールドを生成する", () => {
    const ld = organizationLd(SITE_URL);
    expect(ld["@type"]).toBe("Organization");
    expect(ld["@id"]).toBe("#organization");
    expect(ld.name).toBe("Timeline DSL");
    // url は末尾スラッシュを落とす
    expect(ld.url).toBe("https://timeline-dsl.pages.dev");
    expect(ld.logo).toBe("https://timeline-dsl.pages.dev/icon.svg");
    expect(ld.sameAs).toEqual(["https://github.com/keroway/timeline-dsl"]);
  });
});

describe("webPageLd", () => {
  it("ja locale で inLanguage=ja の WebPage を生成する", () => {
    const ld = webPageLd({
      siteUrl: SITE_URL,
      pathname: "/playground/",
      title: "Playground",
      description: "ブラウザで試す",
      locale: "ja",
    });
    expect(ld["@type"]).toBe("WebPage");
    expect(ld.url).toBe("https://timeline-dsl.pages.dev/playground/");
    expect(ld.name).toBe("Playground");
    expect(ld.description).toBe("ブラウザで試す");
    expect(ld.inLanguage).toBe("ja");
    expect(ld.isPartOf).toEqual({ "@id": "#organization" });
  });

  it("en locale で inLanguage=en の WebPage を生成する", () => {
    const ld = webPageLd({
      siteUrl: SITE_URL,
      pathname: "/en/playground/",
      title: "Playground",
      description: "Try in the browser",
      locale: "en",
    });
    expect(ld.inLanguage).toBe("en");
    expect(ld.url).toBe("https://timeline-dsl.pages.dev/en/playground/");
  });
});

describe("softwareApplicationLd", () => {
  it("ja / en で description が切り替わり共通フィールドを保持する", () => {
    const ja = softwareApplicationLd(SITE_URL, "ja");
    const en = softwareApplicationLd(SITE_URL, "en");
    expect(ja["@type"]).toBe("SoftwareApplication");
    expect(ja.applicationCategory).toBe("DeveloperApplication");
    expect(ja.url).toBe("https://timeline-dsl.pages.dev");
    expect(ja.offers).toEqual({
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    });
    expect(ja.publisher).toEqual({ "@id": "#organization" });
    // locale 別 description は別物
    expect(ja.description).not.toBe(en.description);
    expect(String(en.description)).toMatch(/DSL/);
  });
});

describe("breadcrumbLd", () => {
  it("position が 1 始まりで item が絶対 URL 化される", () => {
    const ld = breadcrumbLd(
      [
        { name: "Home", url: "/" },
        { name: "Docs", url: "/docs/" },
      ],
      SITE_URL,
    );
    expect(ld["@type"]).toBe("BreadcrumbList");
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://timeline-dsl.pages.dev/",
    });
    expect(items[1]).toMatchObject({
      position: 2,
      item: "https://timeline-dsl.pages.dev/docs/",
    });
  });
});

describe("changelogLd", () => {
  const releases: ChangelogRelease[] = [
    {
      name: "v1.14.0",
      tagName: "v1.14.0",
      publishedAt: "2026-05-01T00:00:00Z",
      url: "https://github.com/keroway/timeline-dsl/releases/tag/v1.14.0",
      body: "## Features\n\n- `tdsl fmt` added\n\n```sh\ntdsl fmt\n```",
    },
  ];

  it("CollectionPage と Article の必須フィールドを locale 別に生成する", () => {
    const ld = changelogLd({
      siteUrl: SITE_URL,
      pathname: "/en/changelog/",
      locale: "en",
      releases,
    });
    expect(ld["@type"]).toBe("CollectionPage");
    expect(ld.url).toBe("https://timeline-dsl.pages.dev/en/changelog/");
    expect(ld.mainEntityOfPage).toBe(ld.url);
    expect(ld.inLanguage).toBe("en");
    const parts = ld.hasPart as Array<Record<string, unknown>>;
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      "@type": "Article",
      name: "v1.14.0",
      datePublished: "2026-05-01T00:00:00Z",
      url: "https://github.com/keroway/timeline-dsl/releases/tag/v1.14.0",
      inLanguage: "en",
    });
    // description は markdown 記号・コードブロック・インラインコードを落とした
    // プレーンテキスト（`tdsl fmt` は inline code として丸ごと除去される）
    expect(String(parts[0].description)).not.toMatch(/[`#]/);
    expect(String(parts[0].description)).toBe("Features added");
  });

  it("name 未指定なら tagName を、body 空なら description を省く", () => {
    const ld = changelogLd({
      siteUrl: SITE_URL,
      pathname: "/changelog/",
      locale: "ja",
      releases: [
        {
          name: "",
          tagName: "v1.0.0",
          publishedAt: "2026-01-01T00:00:00Z",
          url: "https://example.com/tag",
          body: "",
        },
      ],
    });
    const parts = ld.hasPart as Array<Record<string, unknown>>;
    expect(parts[0].name).toBe("v1.0.0");
    expect(parts[0]).not.toHaveProperty("description");
    expect(parts[0].inLanguage).toBe("ja");
  });
});

describe("itemListLd", () => {
  it("ItemList / ListItem を position 連番付きで生成する", () => {
    const ld = itemListLd({
      siteUrl: SITE_URL,
      pathname: "/gallery/",
      locale: "ja",
      name: "Gallery",
      description: "サンプル集",
      items: [
        { name: "日本近現代史", description: "幕末から大正までの年表" },
        { name: "開発ロードマップ" },
      ],
    });
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.url).toBe("https://timeline-dsl.pages.dev/gallery/");
    expect(ld.mainEntityOfPage).toBe(ld.url);
    expect(ld.inLanguage).toBe("ja");
    expect(ld.isPartOf).toEqual({ "@id": "#organization" });
    const elements = ld.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(2);
    expect(elements[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "日本近現代史",
      description: "幕末から大正までの年表",
    });
    // description 省略時はキー自体を出さない
    expect(elements[1]).toEqual({ "@type": "ListItem", position: 2, name: "開発ロードマップ" });
  });

  it("en locale で inLanguage=en の URL に揃える", () => {
    const ld = itemListLd({
      siteUrl: SITE_URL,
      pathname: "/en/playground/",
      locale: "en",
      name: "Playground",
      description: "Try in the browser",
      items: [{ name: "Minimal" }],
    });
    expect(ld.inLanguage).toBe("en");
    expect(ld.url).toBe("https://timeline-dsl.pages.dev/en/playground/");
    expect(ld.mainEntityOfPage).toBe("https://timeline-dsl.pages.dev/en/playground/");
  });
});

describe("faqPageLd", () => {
  it("FAQPage / Question / Answer の入れ子構造を生成する", () => {
    const ld = faqPageLd({
      siteUrl: SITE_URL,
      pathname: "/docs/faq/",
      locale: "ja",
      faqs: [{ question: "Q1?", answer: "A1." }],
    });
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.url).toBe("https://timeline-dsl.pages.dev/docs/faq/");
    expect(ld.mainEntityOfPage).toBe(ld.url);
    expect(ld.inLanguage).toBe("ja");
    const entities = ld.mainEntity as Array<Record<string, unknown>>;
    expect(entities[0]).toMatchObject({
      "@type": "Question",
      name: "Q1?",
      acceptedAnswer: { "@type": "Answer", text: "A1." },
    });
  });
});

describe("graphLd", () => {
  it("@context と @graph を持つ JSON 文字列を返す", () => {
    const json = graphLd([organizationLd(SITE_URL)]);
    const parsed = JSON.parse(json);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(Array.isArray(parsed["@graph"])).toBe(true);
    expect(parsed["@graph"][0]["@type"]).toBe("Organization");
  });
});
