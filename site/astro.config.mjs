import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import tdslGrammar from "./src/lib/tdsl.tmLanguage.json" with { type: "json" };

// dev / preview のリッスンポート。PORT env があればそれを使い (portless が割り当てる
// エフェメラルポートに追従)、無ければ従来通り 4321。
const devServerPort = process.env.PORT ? Number(process.env.PORT) : 4321;

export default defineConfig({
  site: "https://timeline-dsl-lp.pages.dev",
  // dev / preview 両方に適用される。host を 127.0.0.1 に固定して
  // preview が ::1 のみ bind する問題 (127.0.0.1 で ECONNREFUSED) も回避する。
  server: {
    host: "127.0.0.1",
    port: devServerPort,
  },
  vite: {
    // 同一 worktree から複数の dev/preview を同時起動すると、既定の cacheDir
    // (node_modules/.vite) を共有してしまい、後発プロセスの dependency 再最適化が
    // /public 配下の WASM (/wasm/tdsl_wasm.js) 解決と競合して WASM ロードが失敗する
    // (#294)。ポートごとに cacheDir を分離してプロセス間の競合を断つ。
    cacheDir: `node_modules/.vite-${devServerPort}`,
    build: {
      rollupOptions: {
        external: ["/pagefind/pagefind-ui.js"],
      },
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      langs: [tdslGrammar],
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "ja",
        locales: {
          ja: "ja",
          en: "en",
        },
      },
    }),
    starlight({
      title: "Timeline DSL",
      description: "Timeline DSL の LP とドキュメント",
      locales: {
        root: { label: "日本語", lang: "ja" },
        en: { label: "English" },
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/keroway/timeline-dsl",
        },
      ],
      components: {
        SocialIcons: "./src/components/DocsA11yMenu.astro",
        Head: "./src/components/StarlightHead.astro",
        Search: "./src/components/DocsSearch.astro",
      },
      customCss: ["./src/styles/starlight.css"],
      sidebar: [
        {
          label: "はじめる",
          translations: { en: "Get Started" },
          items: [
            { label: "概要", translations: { en: "Overview" }, slug: "docs" },
            { label: "Playground", slug: "docs/playground" },
            {
              label: "インストール",
              translations: { en: "Installation" },
              slug: "docs/installation",
            },
            { label: "Quick Start", slug: "docs/quick-start" },
          ],
        },
        {
          label: "文法",
          translations: { en: "Grammar" },
          items: [
            {
              label: "文法とサンプル",
              translations: { en: "Grammar & Examples" },
              slug: "docs/grammar",
            },
          ],
        },
        {
          label: "CLI",
          items: [
            { label: "Commands", slug: "docs/commands" },
            { label: "Configuration", slug: "docs/configuration" },
            {
              label: "CIで検証",
              translations: { en: "Validate in CI" },
              slug: "docs/github-actions",
            },
            { label: "Homebrew", slug: "docs/homebrew" },
          ],
        },
        {
          label: "開発者向け",
          translations: { en: "For Developers" },
          items: [
            {
              label: "コントリビューター向け",
              translations: { en: "Contributing" },
              slug: "docs/contributing",
            },
            {
              label: "サイトのデプロイ",
              translations: { en: "Site Deployment" },
              slug: "docs/deployment",
            },
          ],
        },
        {
          label: "サポート",
          translations: { en: "Support" },
          items: [
            { label: "Troubleshooting", slug: "docs/troubleshooting" },
            { label: "FAQ", slug: "docs/faq" },
          ],
        },
      ],
    }),
  ],
});
