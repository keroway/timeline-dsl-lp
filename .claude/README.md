# timeline-dsl-lp — Claude Code Setup

このディレクトリは Claude Code / Codex / pi 等の AI コーディングエージェントの動作をこのプロジェクト用に
整える共有設定です。`CLAUDE.md`（リポジトリルート）と一緒に読んでください。

## 構成

```
.claude/
├── agents/
│   └── web-director.md        # UX/a11y/ブランド整合性・SEO/i18n/hreflang/JSON-LD の最終判定担当
├── rules/
│   └── implementation-policy.md # 変更の最小性、デザイン規約、i18n 同期、SEO、Issue 運用などの詳細ルール
├── skills/
│   └── starlight-authoring/   # Starlight 執筆スキル（ドキュメント追加・サイドバー・AI/LLM 向け公開）
├── settings.json              # 共有設定（hook 登録・許可プラグイン等、コミット対象）
├── settings.local.json        # 個人設定（.gitignore で除外）
└── agent-memory/              # エージェントの観察ログ（.gitignore で除外）
```

スラッシュコマンドはこのリポジトリには無い。

## 依存ツール

| ツール | 用途 | 必須？ |
|---|---|---|
| `pnpm` | `site/` 配下のビルド・lint・test の実行 | 必須（hook が使用） |
| `jq` | hook 内 JSON 抽出 | 無い環境では非依存フォールバックで動作 |

## Hooks の挙動

### PostToolUse: `astro-check-on-edit.sh`

- 発火条件: `Edit` / `Write` / `MultiEdit` が `site/src/` 配下の `.astro` / `.ts` / `.tsx` / `.mdx` / `.mjs` を編集したとき
- 動作: `astro check` を実行
- 失敗時: 型エラー時は exit 2 で Claude にフィードバック

### Stop: `stop-checks.sh`

- 発火条件: Claude が応答を終えたとき
- 動作: (1) i18n ペアドリフト（ja/en の片方しか変更されていない）を検知して通知、
  (2) 現在ブランチの PR で失敗している GitHub checks があれば一覧表示

### Stop: `detect-stale-dev-servers.sh`

- 発火条件: Claude が応答を終えたとき
- 動作: 放置された `astro dev` プロセスを検知して通知

## Agents の役割分担

| Agent | 担当領域 |
|---|---|
| `web-director` | UX/a11y/ブランド整合性と SEO/i18n/hreflang/JSON-LD の最終判定。実装方針の事前相談 / PR 直前の最終チェック |

## Rules の参照階層

`CLAUDE.md`（最上位） → `.claude/rules/implementation-policy.md`（詳細）の順で参照。矛盾があれば
本ファイルより優先度の高い方（`implementation-policy.md`）が優先される（§0 に明記）。

## 他環境への移植

このディレクトリは macOS / Linux いずれでも動作するように書かれています:

- hook スクリプトは `#!/usr/bin/env bash`
- 絶対パスは `$CLAUDE_PROJECT_DIR` で解決する
- `.claude/agent-memory/` は `.gitignore` で除外（個人のメモ）
- `playwright-cli` skill はリポジトリ層の symlink を撤去し、`~/.claude/skills/`
  （ユーザー層。agent-assets の `install.sh` が張る）だけで足りるようにした
  （agent-assets#276、2026-09-03）

新しい開発者がリポジトリをクローンした場合、追加でやることはありません。Claude Code が
`settings.json` を読み込めば hook が有効になります。
