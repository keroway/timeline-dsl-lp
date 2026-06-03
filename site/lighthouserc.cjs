// Lighthouse CI 設定。perf / a11y / SEO / best-practices のスコア baseline を CI で監視する。
// 既存 smoke と同じく、起動済みの preview server (既定 http://127.0.0.1:4321) を相手に collect する。
// portless 等で別 origin を使う場合は LHCI_BASE_URL を渡す (smoke の *_BASE_URL と同じ流儀)。
//
// 閾値の根拠 (baseline の考え方) は README / README.ja の "Quality gates" 節に記録している。
// 段階導入: performance は CI ランナーの負荷ゆらぎで不安定なため warn 始まり。
// a11y / best-practices / SEO は静的サイトとして安定して取れるため error (閾値割れで CI fail)。

const BASE_URL = process.env.LHCI_BASE_URL ?? "http://127.0.0.1:4321";

// 主要ページのアーキタイプを ja / en 両系統から代表抽出する。
//   /          … LP (ja)
//   /en/       … LP (en)
//   /docs/     … Starlight ドキュメント
//   /playground/ … WASM を伴うインタラクティブページ (最も重い)
//   /gallery/  … 一覧系ページ
const paths = ["/", "/en/", "/docs/", "/playground/", "/gallery/"];

module.exports = {
  ci: {
    collect: {
      url: paths.map((p) => new URL(p, BASE_URL).href),
      // 中央値を取りゆらぎを抑える。
      numberOfRuns: 3,
      settings: {
        // docs サイトはデスクトップ閲覧が主。モバイル emulation より perf が安定する。
        preset: "desktop",
        // CI コンテナ (GitHub Actions ubuntu) では sandbox を無効化しないと Chrome が起動しない。
        chromeFlags: "--no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      // 外部 LHCI server は使わず、レポートを成果物としてローカルに残す。
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
