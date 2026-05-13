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
