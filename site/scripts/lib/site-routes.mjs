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
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"SoftwareApplication"'],
    a11y: true,
  },
  {
    path: "/en/",
    hreflang: true,
    ogImage: "/og/lp.png",
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"SoftwareApplication"'],
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
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/showcase/oda-nobunaga/",
    hreflang: true,
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Showcase: natsume-soseki
  {
    path: "/showcase/natsume-soseki/",
    hreflang: true,
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/showcase/natsume-soseki/",
    hreflang: true,
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Showcase: internet-history
  {
    path: "/showcase/internet-history/",
    hreflang: true,
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/showcase/internet-history/",
    hreflang: true,
    jsonLd: ['"@type":"Organization"', '"@type":"WebPage"', '"@type":"BreadcrumbList"'],
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
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  {
    path: "/en/docs/",
    hreflang: true,
    jsonLd: ['"@type":"Organization"', '"@type":"BreadcrumbList"'],
    a11y: true,
  },
  // Docs grammar（hreflang/JSON-LD チェック対象外、a11y のみ）
  { path: "/docs/grammar/", a11y: true },
  { path: "/en/docs/grammar/", a11y: true },
  // Docs FAQ（hreflang チェック対象外、JSON-LD と a11y の対象）
  {
    path: "/docs/faq/",
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
    jsonLd: [
      '"@type":"Organization"',
      '"@type":"BreadcrumbList"',
      '"@type":"FAQPage"',
      '"@type":"Question"',
    ],
    a11y: true,
  },
];

/** hreflang 3 タグ（ja / en / x-default）確認対象のパス一覧 */
export const HREFLANG_PATHS = _CATALOG.filter((r) => r.hreflang).map((r) => r.path);

/** JSON-LD @type 確認対象（path + required types のペア） */
export const JSONLD_TARGETS = _CATALOG
  .filter((r) => r.jsonLd?.length)
  .map((r) => ({ path: r.path, required: r.jsonLd }));

/** OG 画像確認対象（path + 画像パスのペア） */
export const OG_IMAGE_TARGETS = _CATALOG
  .filter((r) => r.ogImage)
  .map((r) => ({ path: r.path, image: r.ogImage }));

/** a11y WCAG 2.1 AA 巡回対象のパス一覧 */
export const A11Y_PAGES = _CATALOG.filter((r) => r.a11y).map((r) => r.path);
