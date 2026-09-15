/**
 * サイト全ページのルートカタログ。
 * smoke-seo / smoke-a11y / smoke-i18n が URL・JSON-LD 種別・OG 画像を
 * 手書きで重複させないための single source。
 * 新規ページ追加時はここに 1 エントリ追加するだけで全 smoke に反映される。
 *
 * フラグの意味:
 *   hreflang — smoke-seo の hreflang 3 タグ確認対象
 *   jsonLd   — smoke-seo の JSON-LD @type 確認対象（型リスト）
 *   ogImage  — smoke-seo の OG 画像確認対象（画像パス）
 *   a11y     — smoke-a11y の WCAG 2.1 AA 巡回対象
 */
const _CATALOG = [
  // LP
  {
    path: "/",
    hreflang: true,
    ogImage: "/og/lp.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"SoftwareApplication"',
    ],
    a11y: true,
  },
  {
    path: "/en/",
    hreflang: true,
    ogImage: "/og/lp.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"SoftwareApplication"',
    ],
    a11y: true,
  },
  // Playground
  {
    path: "/playground/",
    hreflang: true,
    ogImage: "/og/playground.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"ItemList"',
      '"@type":"ListItem"',
    ],
    a11y: true,
  },
  {
    path: "/en/playground/",
    hreflang: true,
    ogImage: "/og/playground.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"ItemList"',
      '"@type":"ListItem"',
    ],
    a11y: true,
  },
  // Gallery
  {
    path: "/gallery/",
    hreflang: true,
    ogImage: "/og/gallery.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"ItemList"',
      '"@type":"ListItem"',
    ],
    a11y: true,
  },
  {
    path: "/en/gallery/",
    hreflang: true,
    ogImage: "/og/gallery.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"ItemList"',
      '"@type":"ListItem"',
    ],
    a11y: true,
  },
  // Showcase index
  {
    path: "/showcase/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
      '"@type":"CollectionPage"',
    ],
    a11y: true,
  },
  {
    path: "/en/showcase/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
      '"@type":"CollectionPage"',
    ],
    a11y: true,
  },
  // Showcase: oda-nobunaga
  {
    path: "/showcase/oda-nobunaga/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
    ],
    a11y: true,
  },
  {
    path: "/en/showcase/oda-nobunaga/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
    ],
    a11y: true,
  },
  // Showcase: natsume-soseki
  {
    path: "/showcase/natsume-soseki/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
    ],
    a11y: true,
  },
  {
    path: "/en/showcase/natsume-soseki/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
    ],
    a11y: true,
  },
  // Showcase: internet-history
  {
    path: "/showcase/internet-history/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
    ],
    a11y: true,
  },
  {
    path: "/en/showcase/internet-history/",
    hreflang: true,
    ogImage: "/og/showcase.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"BreadcrumbList"',
    ],
    a11y: true,
  },
  // Changelog
  {
    path: "/changelog/",
    hreflang: true,
    ogImage: "/og/changelog.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"CollectionPage"',
      '"@type":"Article"',
    ],
    a11y: true,
  },
  {
    path: "/en/changelog/",
    hreflang: true,
    ogImage: "/og/changelog.png",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"WebPage"',
      '"@type":"CollectionPage"',
      '"@type":"Article"',
    ],
    a11y: true,
  },
  // Docs root
  {
    path: "/docs/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs ページの共通 JSON-LD（全ページ BreadcrumbList + Organizationを pnpm build 後の dist で実測済み）
  // grammar / faq は個別事情があるため御刺当山順に定義。
  //
  // Docs: quick-start
  {
    path: "/docs/quick-start/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/quick-start/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: installation
  {
    path: "/docs/installation/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/installation/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: homebrew
  {
    path: "/docs/homebrew/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/homebrew/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: commands
  {
    path: "/docs/commands/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/commands/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: configuration
  {
    path: "/docs/configuration/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/configuration/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: grammar（hreflang 確認を追加）
  {
    path: "/docs/grammar/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/grammar/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: styling（hreflang 確認を追加, #500）
  {
    path: "/docs/styling/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/styling/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: faq（FAQPage / Question は引き継ぎ）
  {
    path: "/docs/faq/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"BreadcrumbList"',
      '"@type":"FAQPage"',
      '"@type":"Question"',
    ],
    a11y: true,
  },
  {
    path: "/en/docs/faq/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"BreadcrumbList"',
      '"@type":"FAQPage"',
      '"@type":"Question"',
    ],
    a11y: true,
  },
  // Docs: deployment
  {
    path: "/docs/deployment/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/deployment/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: github-actions
  {
    path: "/docs/github-actions/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/github-actions/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: playground
  {
    path: "/docs/playground/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/playground/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: contributing
  {
    path: "/docs/contributing/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/contributing/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: troubleshooting
  {
    path: "/docs/troubleshooting/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/troubleshooting/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: errors（エラーコードリファレンス, #501）
  {
    path: "/docs/errors/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/errors/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: cli-reference（#524）
  {
    path: "/docs/cli-reference/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/cli-reference/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: properties / date-time / wikidata-mapping（#536）
  {
    path: "/docs/properties/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/properties/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/docs/date-time/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/date-time/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/docs/wikidata-mapping/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/wikidata-mapping/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs: data-and-licensing（データ利用とライセンス, #502）
  {
    path: "/docs/data-and-licensing/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/data-and-licensing/",
    hreflang: true,
    ogImage: "/og/docs.png",
    ogImageEngine: "starlight",
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
];

/** hreflang 3 タグ（ja / en / x-default）確認対象のパス一覧 */
export const HREFLANG_PATHS = _CATALOG
  .filter((r) => r.hreflang)
  .map((r) => r.path);

/** JSON-LD @type 確認対象（path + required types のペア） */
export const JSONLD_TARGETS = _CATALOG
  .filter((r) => r.jsonLd?.length)
  .map((r) => ({ path: r.path, required: r.jsonLd }));

/**
 * OG 画像確認対象（path + 画像パスのペア）。
 * SocialMeta.astro 経由（LP/Playground/Gallery/Changelog/Showcase）のページのみ。
 * og:locale / og:locale:alternate も SocialMeta.astro 固有の出力形式（ja_JP/en_US）
 * で smoke-seo が併せて確認するため、別パイプラインの Starlight docs は含めない
 * （下記 STARLIGHT_OG_IMAGE_TARGETS 参照）。
 */
export const OG_IMAGE_TARGETS = _CATALOG
  .filter((r) => r.ogImage && r.ogImageEngine !== "starlight")
  .map((r) => ({ path: r.path, image: r.ogImage }));

/**
 * OG 画像確認対象（Starlight docs 専用）。
 * Starlight は自前で og:locale を出力する（SocialMeta.astro とは形式が異なる:
 * "ja" ではなく "ja_JP" 等ではない）ため、smoke-seo では og:image 系のみを確認し
 * og:locale は確認しない。
 */
export const STARLIGHT_OG_IMAGE_TARGETS = _CATALOG
  .filter((r) => r.ogImage && r.ogImageEngine === "starlight")
  .map((r) => ({ path: r.path, image: r.ogImage }));

/** a11y WCAG 2.1 AA 巡回対象のパス一覧 */
export const A11Y_PAGES = _CATALOG.filter((r) => r.a11y).map((r) => r.path);
