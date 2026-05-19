import type { Locale } from "../i18n";

const ORGANIZATION_ID = "#organization";
const WEBSITE_NAME = "Timeline DSL";
const GITHUB_URL = "https://github.com/keroway/timeline-dsl";

type JsonLdNode = Record<string, unknown>;

function absolute(siteUrl: URL, path: string): string {
  return new URL(path, siteUrl).toString();
}

export function organizationLd(siteUrl: URL): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: WEBSITE_NAME,
    url: siteUrl.toString().replace(/\/$/, ""),
    logo: absolute(siteUrl, "/icon.svg"),
    sameAs: [GITHUB_URL],
  };
}

export function webPageLd(input: {
  siteUrl: URL;
  pathname: string;
  title: string;
  description: string;
  locale: Locale;
}): JsonLdNode {
  return {
    "@type": "WebPage",
    url: absolute(input.siteUrl, input.pathname),
    name: input.title,
    description: input.description,
    inLanguage: input.locale === "en" ? "en" : "ja",
    isPartOf: { "@id": ORGANIZATION_ID },
  };
}

export function softwareApplicationLd(siteUrl: URL, locale: Locale): JsonLdNode {
  const description =
    locale === "en"
      ? "Author validated timelines with a plain-text DSL and render them to SVG via CLI or browser."
      : "プレーンテキストの DSL で年表を記述し、CLI / ブラウザから SVG にレンダリングできるツールです。";
  return {
    "@type": "SoftwareApplication",
    name: WEBSITE_NAME,
    url: siteUrl.toString().replace(/\/$/, ""),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Linux, Windows",
    description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function breadcrumbLd(items: BreadcrumbItem[], siteUrl: URL): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(siteUrl, item.url),
    })),
  };
}

export function graphLd(nodes: JsonLdNode[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  });
}
