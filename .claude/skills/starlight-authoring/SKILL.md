---
name: starlight-authoring
description: Author and modify Astro Starlight docs pages in this repository (timeline-dsl-lp) — where content lives, how the sidebar/i18n/frontmatter are wired, which components are allowed, and how the site exposes itself to AI agents/LLMs (llms.txt, per-page .md, page actions). Use whenever adding, editing, or restructuring anything under site/src/content/docs/, site/astro.config.mjs's `starlight({...})` block, or Starlight-specific components under site/src/components/.
---

# Starlight authoring rules — timeline-dsl-lp

このスキルは `site/` の Starlight ドキュメントサイトを AI エージェントが
「仕様通り・高精度」に構築/更新するための制約とレシピをまとめたもの。
一般的な実装ルールは `.claude/rules/implementation-policy.md` を参照。
ここでは **Starlight 固有** のルールだけを扱う。

## 0. 鉄則（違反したら手を止めて確認する）

1. **記事の追加・編集は必ず `site/src/content/docs/` 以下の Markdown/MDX で行う。**
   `.astro` ページを新規に作ってドキュメントを書かない（LP/Playground/Gallery/Showcase/
   Changelog のような非ドキュメントページだけが `site/src/pages/` 直下の `.astro`）。
2. **サイドバー階層の変更は `site/astro.config.mjs` の `starlight({ sidebar: [...] })`
   を直接編集する。** 新規ページを作っただけではナビに出てこない — sidebar への追記を忘れない。
3. **フロントマターの `title` / `description` は必須。**
   `site/src/content.config.ts` の `docsSchema()` で型強制されているため、欠けると
   `astro check` / `pnpm build` が失敗する。省略・空文字を許容しない。
4. **未知のコンポーネントを勝手に作らない。** 見た目の装飾は Starlight 標準の
   組み込みコンポーネント（`<Tabs>` `<TabItem>` `<Card>` `<CardGrid>` `<Aside>`
   `<Steps>` `<Badge>` `<LinkCard>` `<FileTree>` など）を最優先で使う。
   React/Vue 等のフレームワークアイランドを新規追加する前に、Starlight 標準で
   実現できないか確認する（このリポジトリは Playground など理由がある箇所以外
   フレームワークを持たない）。
5. **新しい Starlight integration/plugin を追加する前に、公式プラグインリファレンス
   <https://starlight.astro.build/reference/plugins/> と対象プラグインの README を
   実際に取得して peerDependencies（`astro` / `@astrojs/starlight` のバージョン範囲）を
   確認する。** このリポジトリは `astro@6.4.6` / `@astrojs/starlight@0.39.2` に固定気味
   なので、`astro@7` 系を要求するプラグインは非互換。ハルシネーションでバージョンを
   決め打ちしない。

## 1. i18n ペア（Starlight 特有の落とし穴）

- コンテンツは `site/src/content/docs/docs/*.mdx`（日本語 = root locale）と
  `site/src/content/docs/en/docs/*.mdx`（英語）がペア。**片方だけ更新して終わらない。**
  Stop hook (`stop-checks.sh`) がドリフトを検知する。
- `sidebar` の各項目は `label` に加えて `translations: { en: "..." }` を必ず付ける
  （root ロケールが日本語のため、英語ラベルは `translations` 側に書く）。
- 新規ページの `slug` は日英で同じパス構造にする（`docs/xxx` / `en/docs/xxx`）。

## 2. コンテンツ追加の手順

1. `site/src/content/docs/docs/<slug>.mdx` と `site/src/content/docs/en/docs/<slug>.mdx`
   を同時に作成。フロントマターに `title` / `description` を両言語分書く。
2. `site/astro.config.mjs` の `sidebar` に該当ページを追記（`label` + `translations.en`
   - `slug`）。
3. `cd site && pnpm astro check && pnpm build` を通す。
4. 新規ページなら `pnpm smoke:seo` / `pnpm smoke:i18n` を実行し、hreflang・JSON-LD が
   両言語分揃っていることを確認する（詳細は implementation-policy.md §5）。

## 3. Starlight コンポーネントの上書き（このリポジトリの現状）

`astro.config.mjs` の `starlight({ components: {...} })` で以下を上書き済み。
変更する際は Starlight のオリジナル実装との差分を意識する（勝手に責務を増やさない）。

| Starlight スロット | 差し替え先 |
|---|---|
| `SocialIcons` | `src/components/DocsA11yMenu.astro` |
| `Head` | `src/components/StarlightHead.astro` |
| `Search` | `src/components/DocsSearch.astro` |
| `Footer` | `src/components/StarlightFooter.astro` |
| `Header` | `src/components/StarlightHeader.astro` |

新しいスロットを上書きする場合は、まず
<https://starlight.astro.build/guides/overriding-components/> で対象コンポーネントの
デフォルト props/挙動を確認してから実装する。

## 4. AI エージェント / LLM 向け公開（導入済みプラグイン）

`astro.config.mjs` の `starlight({ plugins: [...] })` に以下を導入済み。
**この 2 つは docs コレクション配下のページのみが対象** —
LP/Playground/Gallery/Showcase/Changelog（`src/pages/` 直下の非 docs ページ）には
影響しない。

- **`starlight-llms-txt`**（<https://starlight.astro.build/resources/plugins/#starlight-llms-txt）>
  ビルド時に `/llms.txt`（インデックス）・`/llms-full.txt`（全文）・
  `/llms-small.txt`（要約版）をルート直下に生成する。`projectName` は
  Starlight の `title` から独立して `"Timeline DSL"` を明示指定している。
- **`starlight-md-txt`**（<https://github.com/max-ostapenko/starlight-md-txt）>
  各ドキュメントページに対応する生 Markdown を `/<slug>.md` としてビルド時に生成する
  （`.md` を末尾に付けるだけで HTML ではなく Frontmatter 付きの生 Markdown が取れる）。

### 触るときの注意

- どちらも **docs コレクション（`docsSchema`）に依存**するため、`title` /
  `description` を欠かすと出力に反映されない（§0-3 のルールがここでも効く）。
- `starlight-llms-txt` の `exclude` / `promote` / `demote` オプションで特定ページを
  除外・並び替えできる（下書きや長すぎるページを `llms-small.txt` から外したい場合に使う）。
  設定は <https://delucis.github.io/starlight-llms-txt/configuration/> を参照。
- `pnpm build` 後、`dist/llms.txt` `dist/llms-full.txt` `dist/docs/**/*.md` が
  生成されていることを目視確認する（CI では明示アサートしていないため、大きな
  ドキュメント構成変更をした PR ではローカルで一度確認する）。
- 新しいプラグインを追加で足す場合（例: `starlight-page-actions` の
  「Copy Markdown / Open in AI chat」ボタン UI や `starlight-biel` の Ask AI
  チャットボット）は、UI に見える変更になるため implementation-policy.md §3
  （デザイン規約）に従い web-director agent のレビューを通してから導入する。
  現時点では未導入（将来検討）。

## 5. ハルシネーション防止のための調べ方

Starlight の API/プラグイン仕様について確信が持てない場合、学習知識だけで
コードを書かない。以下の順で一次情報を取得してから実装する。

1. `https://starlight.astro.build/reference/` — Starlight 設定スキーマの正
2. `https://starlight.astro.build/reference/plugins/` — 公式プラグイン一覧
   （プラグインを追加する前に必ずここで存在確認する。存在しない/非公式の
   プラグイン名を作文しない）
3. 対象パッケージの npm ページで `peerDependencies` を確認（`astro` /
   `@astrojs/starlight` のバージョン範囲がこのリポジトリと合うか）
4. それでも仕様が読み取れない場合はユーザーに質問する（implementation-policy.md §10）。
