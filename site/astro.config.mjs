import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tdslGrammar from "./src/lib/tdsl.tmLanguage.json" with { type: "json" };

export default defineConfig({
  site: "https://timeline-dsl.pages.dev",
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
      },
      customCss: ["./src/styles/starlight.css"],
      sidebar: [
        {
          label: "はじめる",
          translations: { en: "Get Started" },
          items: [
            { label: "概要", translations: { en: "Overview" }, slug: "docs" },
            { label: "Playground", slug: "docs/playground" },
            { label: "インストール", translations: { en: "Installation" }, slug: "docs/installation" },
            { label: "Quick Start", slug: "docs/quick-start" },
          ],
        },
        {
          label: "文法",
          translations: { en: "Grammar" },
          items: [{ label: "文法とサンプル", translations: { en: "Grammar & Examples" }, slug: "docs/grammar" }],
        },
        {
          label: "CLI",
          items: [
            { label: "Commands", slug: "docs/commands" },
            { label: "Configuration", slug: "docs/configuration" },
            { label: "CIで検証", translations: { en: "Validate in CI" }, slug: "docs/github-actions" },
            { label: "Homebrew", slug: "docs/homebrew" },
          ],
        },
        {
          label: "開発者向け",
          translations: { en: "For Developers" },
          items: [
            { label: "コントリビューター向け", translations: { en: "Contributing" }, slug: "docs/contributing" },
            { label: "サイトのデプロイ", translations: { en: "Site Deployment" }, slug: "docs/deployment" },
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
