import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://timeline-dsl.pages.dev",
  integrations: [
    starlight({
      title: "Timeline DSL",
      description: "Timeline DSL の LP とドキュメント",
      defaultLocale: "ja",
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
            { label: "インストール", slug: "docs/installation" },
            { label: "Quick Start", slug: "docs/quick-start" },
            { label: "Deployment", slug: "docs/deployment" },
          ],
        },
      ],
    }),
  ],
});
