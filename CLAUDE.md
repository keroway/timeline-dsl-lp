# CLAUDE.md

> **English summary**: This is the LP / documentation site for Timeline DSL, built with Astro 6 + Starlight and deployed to Cloudflare Pages via GitHub integration. All commands run under `site/`. The build pipeline runs WASM smoke tests first, then `astro check`, then `astro build` — CI passes when `pnpm build` succeeds. WASM binaries for the Playground are vendored in `site/public/wasm/`; update them by rebuilding `crates/tdsl-wasm` in the main repo and syncing the output.

Timeline DSL の LP / ドキュメントサイトです。

## Tech stack

- Framework: Astro 6 + Starlight
- Package manager: pnpm 10.33.3（`cd site` 後に実行）
- Node.js: 24
- Deploy: Cloudflare Pages（GitHub integration 経由、push 自動デプロイ）
- Site URL: https://timeline-dsl.pages.dev

## Commands

```sh
cd site
pnpm install --frozen-lockfile  # 依存インストール
pnpm dev                        # 開発サーバー（localhost:4321）
pnpm build                      # smoke:wasm → astro check → astro build
pnpm preview                    # ビルド成果物をローカルプレビュー
pnpm fetch:releases             # GitHub releases を site/src/data/ に取得
pnpm smoke:wasm                 # WASM 単体 smoke テスト
pnpm smoke:playground           # Playground の HTTP smoke テスト
pnpm smoke:playground:browser   # Playwright ブラウザ smoke テスト
```

`pnpm smoke:playground:browser` を初回実行する前に、Chromium バイナリの取得が必要:

```sh
pnpm exec playwright install chromium
```

## Parallel dev（portless / 任意）

複数ブランチ・worktree を同時に動かすときの 4321 衝突を避けたい場合、
[portless](https://github.com/vercel-labs/portless) で名前付き `.localhost` URL を使える。
**任意ツール**であり、未導入なら従来通り `pnpm dev`（4321）で動く。CI / Cloudflare デプロイには一切影響しない。

```sh
npm i -g portless                # 一度だけ。初回 portless 実行時に 443番/ローカルCA のため管理者権限へ自動昇格
cd site && portless              # https://timeline-dsl.localhost で起動（ポートは自動割当）
```

仕組み: `astro.config.mjs` の `server.port` は `process.env.PORT` を読むため、portless が渡す
エフェメラルポートに追従する。worktree のブランチ名は URL に自動で前置される（`branch.timeline-dsl.localhost`）。

smoke を portless URL に向ける場合は各 `*_BASE_URL` を渡す:

```sh
PLAYGROUND_BASE_URL=https://timeline-dsl.localhost pnpm smoke:playground
I18N_BASE_URL=https://timeline-dsl.localhost pnpm smoke:i18n
SEO_BASE_URL=https://timeline-dsl.localhost pnpm smoke:seo
```

注意: portless の URL は HTTPS + ローカル CA。node fetch / Playwright が CA を信頼できず browser smoke が
証明書エラーになる場合は、従来の `http://127.0.0.1:4321`（`pnpm preview` / `pnpm dev`）にフォールバックする。

## Project structure

```
site/
  src/
    components/   # Astro コンポーネント
    content/      # ドキュメント MDX（Starlight）
    data/         # 生成データ（releases.generated.json 等）
    lib/          # WASM ラッパー（tdsl-wasm.ts）等
    pages/        # ルーティング
    styles/       # グローバル CSS（デザイントークン）
  public/wasm/    # Vendoring した WASM バイナリ
```

## WASM bundling

Playground / runnable docs は `site/src/lib/tdsl-wasm.ts` 経由で WASM を呼ぶ。
バイナリは `site/public/wasm/` に vendoring 済み。更新時は本体リポジトリの
`crates/tdsl-wasm` を `wasm-pack build --target web` し、生成物を `site/public/wasm/` に同期する。

## Deploy policy

- PR / main push: Cloudflare Pages が自動ビルド・デプロイ（GitHub Actions は CI のみ）
- `pnpm build` が通れば CI 通過
- デプロイ再実行は Cloudflare Pages dashboard の Retry deployment を使う

## Design

デザイン決定は `DESIGN.md` に記述（カラートークン・タイポグラフィ・レイアウト原則）。
新しい色は `site/src/styles/global.css` の既存 CSS 変数を優先して使う。

## Issue workflow

- 着手: assignees + `in-progress` ラベル + 着手コメントの 3 点セット
- CLOSED issue には触らない

## Claude Code setup

このリポジトリは Claude Code 専用に以下を整備している。実装に入る前に必ず参照する。

- **実装ルール**: `.claude/rules/implementation-policy.md` — 変更の最小性、root-cause 修正、デザイントークン、i18n ペア同期、SEO/JSON-LD、smoke 拡充、Issue 運用などを定義。
- **Web ディレクター agent**: `.claude/agents/web-director.md` — UX/a11y/ブランド整合性と SEO/i18n/hreflang/JSON-LD の最終判定担当。実装方針の事前相談 / PR 直前の最終チェックに `Agent` ツールで `subagent_type: web-director` を指定して呼ぶ。
- **Hooks** (`.claude/hooks/`):
  - `astro-check-on-edit.sh` — PostToolUse (Edit/Write/MultiEdit) で `site/src/` 配下の `.astro` / `.ts` / `.tsx` / `.mdx` / `.mjs` 編集後に `astro check` を実行。型エラー時は exit 2 で feedback。
  - `stop-checks.sh` — Stop 時に (1) i18n ペアドリフト (ja/en の片方しか変更されていない) を検知して通知、(2) 現在ブランチの PR で失敗している GitHub checks があれば一覧表示。
- 設定本体: `.claude/settings.json`
