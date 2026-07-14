# Timeline DSL Landing & Docs

[English README →](./README.md)

[![Astro](https://img.shields.io/badge/Astro-6.4.6-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![Starlight](https://img.shields.io/badge/Starlight-0.39.2-5A45FF)](https://starlight.astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.33.3-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-deployed-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Lighthouse CI](https://img.shields.io/badge/Lighthouse%20CI-enabled-F44B21?logo=lighthouse&logoColor=white)](https://github.com/GoogleChrome/lighthouse-ci)

公開リポジトリになった [Timeline DSL](https://github.com/keroway/timeline-dsl) の LP / ドキュメントサイトです。Timeline DSL は、年表をテキストで定義し、Wikidata 由来のデータを取り込み、HTML / SVG / PNG / PDF にレンダリングする Rust 製 DSL コンパイラです。

- Site: <https://timeline-dsl-lp.pages.dev>
- Main repository: <https://github.com/keroway/timeline-dsl>
- Playground / WebUI: <https://keroway.github.io/timeline-dsl/>
- このサイトが追従している最新リリース: `v1.25.0`（`site/public/wasm/package.json`、生成 changelog）

## 技術スタック

| 領域 | スタック | 補足 |
| --- | --- | --- |
| サイトフレームワーク | Astro 6 + Starlight 0.39 | LP、Docs、Changelog、Gallery、Showcase、Playground を静的生成します。 |
| 言語 / ランタイム | TypeScript 6、Node.js 24、pnpm 10 | すべてのコマンドは `site/` 配下で実行します。 |
| スタイリング | Astro コンポーネント + CSS トークン | デザイントークンは `site/src/styles/global.css` に集約。色の直書きは避けます。 |
| Playground | vendoring した `@keroway/tdsl-wasm` 1.25.0 | ブラウザ内検証と SVG レンダリングは `site/src/lib/tdsl-wasm.ts` 経由に統一します。 |
| 検索 | build 時に生成する Pagefind | サイト全体検索ダイアログで利用します。 |
| 品質管理 | `astro check`、Vitest、ESLint、Prettier、axe-core、Playwright、Lighthouse CI | `pnpm build` が最低限の CI ゲート。SEO / i18n / a11y / Playground の smoke も用意しています。 |
| ホスティング | Cloudflare Pages | GitHub integration が `site/` を root として `dist/` を公開します。 |

## ローカル開発

```sh
cd site
pnpm install --frozen-lockfile
pnpm dev
```

よく使うコマンド:

```sh
pnpm fetch:releases             # keroway/timeline-dsl の GitHub Releases を site/src/data/ に取得
pnpm smoke:wasm                 # vendoring した WASM bridge の smoke test
pnpm smoke:playground           # Playground の HTTP smoke test
pnpm smoke:a11y                 # 主要ページの axe-core 監査（Chromium が必要）
pnpm lint
pnpm format:check
pnpm build                      # smoke:wasm → astro check → astro build
pnpm preview
```

## Deploy

Cloudflare Pages の運用方式は Cloudflare の GitHub integration に固定します。GitHub Actions は CI として `pnpm build` を確認し、公開と Preview URL の作成は Cloudflare Pages に任せます。

Cloudflare Pages project:

- Project name: `timeline-dsl`
- Production branch: `main`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: `site`
- Deploy command: 設定項目が出ない

Workflows:

- `Site build`: PR、`main` push、手動実行で `pnpm build` を実行する CI。
- `Remove in-progress label on close`: PR が merge されたとき、本文の `Closes #N` / `Fixes #N` / `Resolves #N` で参照された issue から `in-progress` ラベルを除去する。Issue が直接 close されたときも当該 issue から除去する。手動実行時は `issue_number` を指定して任意の issue から除去できる。

Event policy:

- `pull_request`: GitHub Actions の `Site build` と Cloudflare Pages の Preview deployment を実行する。レビュー時は Cloudflare Pages Preview URL で `/` と `/docs/` を確認する。
- `push` to `main`: Cloudflare Pages が production branch `main` として <https://timeline-dsl-lp.pages.dev> にデプロイする。
- `release.published`: Cloudflare Pages の GitHub integration では直接の deploy trigger にしない。リリースは `main` への merge 後、production deployment が成功してから公開する。
- `workflow_dispatch`: GitHub Actions の CI を手動再実行する用途に限定する。公開の再実行は Cloudflare Pages dashboard の Retry deployment を使う。

Cloudflare の設定画面で Deploy command が必須になっている場合や、非本番ブランチのデプロイコマンドが表示されている場合は、Pages ではなく Workers Builds の設定です。このサイトは Workers ではなく Pages project として、Cloudflare dashboard の Pages から GitHub repository を import します。

## Quality gates (Lighthouse CI)

`Site build` ワークフローは smoke の後に、起動済み preview server を相手に Lighthouse CI (`@lhci/cli`) を実行します。performance / accessibility / SEO / best-practices スコアの劣化を CI で検知します。ローカルでは preview を立ててから実行します:

```sh
cd site
pnpm preview &          # または pnpm dev
pnpm lhci               # 別 origin を対象にする場合は LHCI_BASE_URL を渡す
```

監査対象 (ja / en 両系統からアーキタイプを 1 ページずつ抽出): `/`、`/en/`、`/docs/`、`/playground/`、`/gallery/`。各ページを 3 回計測し中央値で assertion します。設定: `site/lighthouserc.cjs`。

baseline 閾値と根拠:

| カテゴリ | レベル | 最低スコア | 根拠 |
| --- | --- | --- | --- |
| Performance | `warn` | 0.80 | LCP/TBT は共有 CI ランナーの負荷でゆらぐ。まずは非ブロッキングの warn で開始し、安定を確認してから `error` へ引き上げる (段階導入)。 |
| Accessibility | `error` | 0.90 | トークン駆動の静的サイトでは安定して取れる。axe-core の `smoke:a11y` を補完する。 |
| Best practices | `error` | 0.90 | console エラー・安全でないリソース・非推奨 API の混入を検知する。 |
| SEO | `error` | 0.90 | 発見性がサイトの生命線。metadata / hreflang / JSON-LD の劣化は CI で fail させる。 |

Docs サイトはデスクトップ閲覧が主なため desktop preset を使い、performance スコアを安定させています。閾値の引き上げや performance の `error` 昇格は `site/lighthouserc.cjs` の `assert.assertions` を編集します。

## WASM bundle

Playground と runnable docs からは `site/src/lib/tdsl-wasm.ts` だけを経由して Timeline DSL WASM を呼び出します。生成済みの `@keroway/tdsl-wasm` ブラウザパッケージを `site/public/wasm/` に vendoring し、本体リポジトリの release pipeline から独立して LP を build できるようにしています。

更新時は本体 repo の `crates/tdsl-wasm` を `wasm-pack build --target web` し、`tdsl_wasm.{js,d.ts}`、`tdsl_wasm_bg.wasm`、`package.json` を `site/public/wasm/` に同期します。`pnpm build` は `check_source` と `render_svg_from_source` の smoke を先に実行します。
