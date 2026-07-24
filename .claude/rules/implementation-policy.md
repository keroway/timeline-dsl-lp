# Implementation Policy — timeline-dsl-lp

このリポジトリで Claude Code が実装作業を行うときに **必ず** 守るルールをまとめる。違反した場合は web-director agent によって NO-GO 判定される前提で書かれている。

## 0. 大前提

- 作業はすべて `site/` 配下で行う。`pnpm` コマンドは `cd site` してから。
- `pnpm build` が通ることが merge 可能の最低条件。CI もこれを見ている。
- Cloudflare Pages が main push と PR で自動デプロイするため、main を壊さない。

## 1. 変更の最小性

- バグ修正に「ついで」のリファクタリングを混ぜない。一回のコミットは一つの意図。
- 「将来こうなるかも」の抽象化を入れない。3 回似たコードが現れるまで共通化しない。
- 未使用の変数・コメント・export を残さない。`_unused` リネームのような後方互換シムを書かない。
- DRY のためだけに新規ファイルを作らない。**既存ファイルへの追記が常に第一選択**。

## 2. 根本原因 (root cause) を直す

- テストや型エラーが出たら **エラーメッセージを抑える** のではなく原因を直す。
- `// @ts-ignore` / `// biome-ignore` / `any` の追加は禁止。例外は web-director agent に明示的に承認を取ってから。
- `--no-verify` / `--force` / `git reset --hard` などの破壊的・回避的コマンドは、ユーザーに口頭で承認を得てから。

## 3. デザイン規約

- 新しい色を直書きしない。`site/src/styles/global.css` の `--color-*` トークンを使う。
- 新色が本当に必要な場合は **light / dark / high-contrast の 3 セット** を同時に追加する。
- DESIGN.md の 3 原則 (Source as truth / Editor first / Calm density) から外れる装飾は入れない。1 セクション 1 メッセージを守る。
- lane パレット (`warm` 起点 / `gold` 周年 / `plum` 人物 / `sky` 外部要因) の意味を再利用前に確認する。

## 4. i18n ペアの同期

- `site/src/content/docs/docs/*.mdx` を編集したら、対応する `site/src/content/docs/en/docs/*.mdx` も同時に更新する (内容のドリフトは Stop hook が検知する)。
- `site/src/i18n/ja.ts` と `site/src/i18n/en.ts` のキーは必ずペアで増減させる。
- 翻訳が用意できない場合は **その PR の中で対応する**。「後で英語を追加します」コミットを残さない。

## 5. SEO / hreflang / JSON-LD

- 新規ページを追加したら `pnpm smoke:seo` と `pnpm smoke:i18n` がパスすることを確認する。
- `<title>` / `<meta description>` / OGP は言語ごとに別物。日本語ページに英語タイトルを残さない。
- `hreflang` は日英両方からリンクする (片側だけだと不完全)。
- JSON-LD の `mainEntityOfPage` URL は当該言語の URL に揃える。

## 6. テスト・スモークの拡充

- 新規ページ / 新規 i18n キー / 新規 SEO ルールを追加したら、対応する smoke スクリプト (`site/scripts/smoke-*.mjs`) に検証を追加する。
- Playground / WASM 周りの変更は `pnpm smoke:wasm` と `pnpm smoke:playground` の両方が通ることを確認する。
- ブラウザ smoke (`pnpm smoke:playground:browser`) は CI では走らないので、UI 変更時はローカルで一度通す。

## 7. WASM の更新フロー

- WASM バイナリは `site/public/wasm/` に vendoring 済み。
- 更新は本体リポジトリ (`~/dev/src/github/keroway/timeline-dsl/crates/tdsl-wasm/`) で `wasm-pack build --target web` した成果物を `cp` で同期する。
- バージョンアップは独立 PR にする (機能変更と混ぜない)。

## 8. Issue 運用

- Issue 着手は **assignees + `in-progress` ラベル + 着手コメント** の 3 点セット (詳細は MEMORY の `issue_status_management`)。
- **CLOSED issue には触らない** — 再オープン or 新規 issue を立てる。
- PR の本文には対応 issue を `Closes #N` で必ず紐付ける。

## 9. PR の責務

- PR タイトルは 70 文字以内、要約は本文に書く。
- 変更が複数の責務に跨るなら PR を分ける。
- main への force push は禁止 (CI 履歴と Cloudflare Pages のデプロイ履歴が壊れる)。
- マージ前に Cloudflare Pages の preview デプロイが Green を確認する。

## 10. 不確実なときの行動

- 仕様の意図が読めない場合、まず `git log -p` / `gh pr list` で直近の文脈を確認する。
- それでも判断できなければユーザーに質問する。**勝手に決めて実装しない**。
- 大きな変更前に web-director agent に方針レビューを依頼する選択肢を常に持つ。
