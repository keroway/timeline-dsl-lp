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
      defaultLocale: "ja",
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/keroway/timeline-dsl",
        },
      ],
      customCss: ["./src/styles/starlight.css"],
      sidebar: [
        {
          label: "はじめる",
          items: [
            { label: "概要", slug: "docs" },
            { label: "Playground", slug: "docs/playground" },
            { label: "インストール", slug: "docs/installation" },
            { label: "Quick Start", slug: "docs/quick-start" },
          ],
        },
        {
          label: "文法",
          items: [{ label: "文法とサンプル", slug: "docs/grammar" }],
        },
        {
          label: "CLI",
          items: [
            { label: "Commands", slug: "docs/commands" },
            { label: "Configuration", slug: "docs/configuration" },
            { label: "CIで検証", slug: "docs/github-actions" },
            { label: "Homebrew", slug: "docs/homebrew" },
          ],
        },
        {
          label: "開発者向け",
          items: [
            { label: "コントリビューター向け", slug: "docs/contributing" },
            { label: "サイトのデプロイ", slug: "docs/deployment" },
          ],
        },
        {
          label: "サポート",
          items: [
            { label: "Troubleshooting", slug: "docs/troubleshooting" },
            { label: "FAQ", slug: "docs/faq" },
          ],
        },
      ],
    }),
  ],
});
