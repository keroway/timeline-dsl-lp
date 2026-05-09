# DESIGN.md

このドキュメントは `timeline-dsl-lp`（LP / Docs サイト）の現行デザイン決定を言語化したものです。新規ブランドの再定義ではなく、`site/src/styles/global.css` と各ページに既に組み込まれている決定を、後続の改善が同じ方向を向けるように整理することを目的としています。

対象は LP `site/` のデザイン指針です。Timeline DSL 本体（CLI / WASM レンダラー / DSL 仕様）の機能設計は対象外です。本体側の出力 SVG と LP の見た目を整合させる **マッピング規則** だけは含めます。

---

## 1. Core Concept

このサイトが優先する性格は次の 3 つです。

- **Source as truth.** 年表は `.tdsl` というテキスト入力から再生成できる成果物であり、サイト自身もその思想を反映する。コード・コマンド・出力プレビューを並置して、入力から出力までの距離が近いことを見せる。
- **Editor first.** 一次的な閲覧者は開発者・教材作成者・歴史的事象を整理したい人。装飾よりも、コード片の読みやすさ、CLI 出力の質感、検証結果の即時性を優先する。
- **Calm density.** 静的なヒーロー → 機能 → ワークフロー → ユースケース → インストールという積層は維持する。1 画面で過剰に語らず、各セクションが 1 つのメッセージだけを持つ。

迷ったときの判断軸：派手さよりも誠実さ、画面の盛り上げよりもコード片の可読性を優先します。

---

## 2. Color Palette

色は `site/src/styles/global.css` の `:root` 変数を起点にします。新規の色を導入する前に、既存トークンで賄えないか先に確認してください。

### Base tokens（light）

| Token | Value | 用途 |
| --- | --- | --- |
| `--color-bg` | `#ffffff` | ページ背景 |
| `--color-ink` | `#17212b` | 本文・見出し |
| `--color-muted` | `#596575` | 補足文・メタ情報 |
| `--color-line` | `#d8dde5` | 区切り線・パネル枠 |
| `--color-panel` | `#f6f8fb` | カード・コードブロック背景 |
| `--color-accent` | `#0d766f` | プライマリ CTA・リンク・進行系のインジケーター |
| `--color-accent-strong` | `#095c56` | accent の hover / focus 強調 |

### Lane palette

`event` / `span` を視覚的に分類する 4 系統。LP 内のミニタイムライン、ユースケースカード、ヒーローのプレビューで横断的に使います。lane の意味づけは原則として表のとおりに維持します。

| Token | Value | セマンティクス |
| --- | --- | --- |
| `--color-warm` | `#a74718` | 起点・創設・始期（warm） |
| `--color-gold` | `#d69a24` | 周年・節目・継続するもの（gold） |
| `--color-plum` | `#7b4569` | 人物・主体・登場（plum） |
| `--color-sky` | `#2c6f9f` | 外部要因・環境・地理（sky） |

### Dark mode

`@media (prefers-color-scheme: dark)` で以下を上書きします。lane パレットは light と共通です。

| Token | Value |
| --- | --- |
| `--color-bg` | `#111920` |
| `--color-ink` | `#e8f0f8` |
| `--color-muted` | `#8fa3ba` |
| `--color-line` | `#2a3544` |
| `--color-panel` | `#1a2434` |
| `--color-accent` | `#1a9e96` |
| `--color-accent-strong` | `#22c4bb` |

### High-contrast variant

`:root[data-a11y-contrast="high"]` では Windows ハイコントラストに近い系統色（純青 `#0000ff` / 純黒 `#000000` 等）に切り替えます。lane の色も同じ規則で、画面上で確実に区別できる飽和色に置換されます。詳細は global.css の対応ブロックを参照してください。

### 使用ルール

- アクセント色（`--color-accent` / `--color-accent-strong`）は CTA とフォーカスリングに限定し、本文中に散布しない。
- パネル（`--color-panel`）は重ねがけしない。1 階層までで止める。
- lane パレットは LP 内で意味を保つ。新しい意味を割り当てる前に、既存セマンティクスで成立しないか検討する。
- 配色追加が必要な場合は、必ず light / dark / high-contrast の 3 系統を同時に決める。

---

## 3. Typography

### Font tokens

| Token | Stack |
| --- | --- |
| `--font-display` | `"Avenir Next", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif` |
| `--font-sans` | `Aptos, "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", "Yu Gothic UI", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif` |
| `--font-mono` | `"Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace` |

OS フォントへのフォールバックを前提にしています。Web フォントの self-host は現状採用していません（読み込み戦略は #53 の追加施策で検討）。

### 用途別の使い分け

| 用途 | フォント | 補足 |
| --- | --- | --- |
| ヒーロー H1・セクション H2 | `--font-display` | weight 760 / line-height 1.15 |
| 本文・段落 | `--font-sans` | line-height 1.65、`font-feature-settings: "palt" 1` |
| アイブロウ（kicker） | `--font-mono` | uppercase、letter-spacing をやや広めに |
| コード片・CLI 出力・年数ラベル | `--font-mono` | リガチャは抑制せず標準で許容 |
| パンくず・メタ情報 | `--font-sans` | `--color-muted` で弱める |

### サイズの基準

ベースフォントサイズは `--font-size-base`（標準 `1rem`）。a11y メニューで `large` (`1.25rem`) / `extra-large` (`1.5rem`) に切り替わります。すべての font-size はこれを基準にした相対値で書き、px 直値は使いません。

主要見出し：

- `.page-hero h1`: `4.3rem`
- `.section-header h2`: `2.25rem`（weight 760）
- `.lead`（リード文）: max-width `42rem`、本文と同サイズ

---

## 4. Layout

### Page shell

- セクションの最大幅: `min(1120px, calc(100% - 2rem))`
- セクションの縦 padding: 通常 `3rem 0`、ページヒーローは `clamp(2.2rem, 4vw, 3.5rem) 0`
- 文章ブロックの max-width: `42rem`〜`48rem`（読みやすさ優先で延ばさない）

### Spacing

`gap` と `padding` は次の段階値を基本とします。中間値の濫用は避けます。

`0.35rem / 0.5rem / 0.7rem / 1rem / 1.5rem / 2rem / 2.7rem`

### Radius

`3px / 4px / 6px / 8px / 999px (pill)` の 5 段階。状況に応じて選びます。

- カード・パネル: `8px`
- ボタン・小要素: `6px`
- バッジ・タグ: `4px`
- 細い装飾線: `3px`
- ピル状の lane バー・dot: `999px`

### Breakpoints

- `820px`: タブレット以下。ヒーローや usecase グリッドが縦積みになる境界。
- `480px`: モバイル。文字サイズと padding を更に詰める。

`@media (hover: hover)` でホバー演出のみを切り替える方針も維持します。タッチデバイスで hover 残留が出ないように。

---

## 5. Components

主要コンポーネントの責務と維持したい振る舞いです。

### `SiteHeader`

- 共通ヘッダー。各ページから `SiteHeader currentPath="..."` で利用。
- 内部にアクセシビリティメニューのトグルを持つ（reduced motion / 高コントラスト / 文字サイズ）。設定は `localStorage` (`tdsl-a11y-settings`) に保存し、`<html>` の `data-a11y-*` 属性として適用される。

### Hero

- 左：コピー＋ CTA（Playground / Docs / GitHub）＋ Latest release の 1 行。
- 右：エディタ風パネル（`.tdsl` ソース）＋レンダリング済みプレビュー＋ `tdsl check` 結果のコマンドストリップ。
- 「テキスト → 検証 → 描画」の 3 点が縦に並ぶことで、ツールのワークフローそのものをヒーローで示す。

### Feature card (`.feature`)

- 3 枚構成（Author / Validate / Render）を維持。
- 各カードは visual（コード / 端末 / ミニタイムライン）と本文の 1 セットで完結し、横展開しない。
- visual の種類を増やすときは `Feature["visual"]` の判別共用体を更新する。

### Workflow step

- 数字付きのステップ（01 / 02 / 03）。「ブラウザ → CLI → CI」の 3 段階を維持する。

### Usecase card

- 4 種類（物語・授業・組織・調査）。ミニ年表バーで lane パレットを再利用する。
- 抽象化しすぎず、固有名（架空世界年表 / Wikidata scaffold 等）を残す。

### Install band

- インストールコマンドは現状 `brew install keroway/tap/timeline-dsl` の 1 行。Copy ボタンは `data-copy-target` で対応 ID を指定し、`navigator.clipboard.writeText` + `execCommand` フォールバックで実装済み。新規導入チャネルが増えたときは別バンドに分けるか、タブで切り替える設計を先に決める。
- ボタン UI は **アイコン専用 (32×32, インライン SVG clipboard / check icon)** で、Docs 配下の Expressive Code Copy ボタンと意匠を揃える。クリック成功時は `.is-copied` クラスで check icon に切替 + border を accent 色に変化（1.8s で復帰）。SR 向け feedback は `aria-live="polite"` の `.copy-status` で日本語 (`コピーしました`) を読み上げる。

### Playground

- 3 ペイン: editor / preview / diagnostics。サンプルセレクタとダウンロードボタン（TDSL / SVG）を上部に置く。
- `?source=` URL パラメータでソースをプリロードできる。ギャラリーや Docs から「Edit this example」で送り込む導線はこの機構を使う。
- 検証は WASM 経由（`site/src/lib/tdsl-wasm.ts`）。debounce は 420ms。

### Code block

- LP 内の `.tdsl` コード片は Astro 標準の `<Code lang="tdsl" />`（内部で Shiki を呼ぶ）でハイライトする。ヒーローの `world-history.tdsl` プレビューと、Author タイプの feature card がこの経路で描画される。
- 文法定義は `site/src/lib/tdsl.tmLanguage.json`（scope: `source.tdsl`）に同梱する。Astro `<Code>` は `markdown.shikiConfig` を参照しない独立 Shiki インスタンスを持つため、grammar は `lang` prop に LanguageRegistration オブジェクトとして直接渡す（`<Code lang={tdslLang} ...>`）。`astro.config.mjs` の `markdown.shikiConfig.langs` には将来 Markdown ベースのページを書いたときの保険として同じ grammar を登録してある。
- ハイライト対象は次の通り。`timeline` / `lane` / `event` / `event_range` / `span` / `import` / `map` / `as` 等のキーワード、年数リテラル（`2024`, `-221`）と範囲（`980..1260`）、`"…"` / `'…'` 文字列、属性キー（`title`, `unit`, `range`, `calendar`, `kind`, `order`, `id`, `tags`, `source`, `origin`, `start`, `end`, `label`, `lane`）、`#` から行末のコメント、`{}` `[]` `()` 等の punctuation、Wikidata QID（`Q7209` / `P571`）と `claim()` 関数。
- Shiki が `<pre>` に付ける inline `background-color` はパネル側のデザイン（`.editor-panel` / `.feature-code`）と衝突するため、`.code-sample` および `.feature-code pre` で `background: transparent !important;` を当てて打ち消す。
- 配色は `<Code>` の `themes={{ light: "github-light", dark: "github-dark" }} defaultColor={false}` で dual themes 化。`defaultColor: false` のとき token の前景・背景は `--shiki-light` / `--shiki-dark` の CSS variables だけが出力されるので、`global.css` で `prefers-color-scheme` メディアクエリにより `color: var(--shiki-light | --shiki-dark)` を切り替える。Docs（Expressive Code）は dual themes をデフォルトで持つため追加 CSS は不要。

### Docs code block / Copy button

- Docs（`/docs/...`）配下のコードブロックは Starlight 標準の Expressive Code が描画する。LP 側の `<Code>` 経路とは別系統で、`.tdsl` 文法は `site/ec.config.mjs` の `defineEcConfig({ shiki: { langs: [tdslGrammar] } })` で別途登録する（Astro の `markdown.shikiConfig` は EC 配下では参照されないため）。Docs MDX で ` ```tdsl ` フェンスを書くとそのまま `source.tdsl` でトークナイズされる。
- Copy ボタンは EC 標準のまま使用する。**文字ラベルなしのアイコン専用ボタン**（32×32, インライン SVG icon）で、テック系 docs（Vercel / Stripe / Astro 等）と概ね同等の見た目。
- アクセシビリティ: `title` 属性によるツールチップと、コピー成功時のフィードバックを `aria-live="polite"` 領域に出す方式（EC 標準）。
- 文言ローカライズは `site/ec.config.mjs` で `pluginFramesTexts.overrideTexts(undefined, …)` を使い、`copyButtonTooltip` / `copyButtonCopied` を日本語化する。EC 0.42 系では `aria-label` を直接上書きする hook が無いため、`title` での補助に留める。
- アイコン化検討の経緯は #62。EC 標準は既に icon-only だったため EC 側は文言ローカライズに留め、LP 側の Install band Copy ボタンを EC と意匠を揃える形でアイコン化した（同 PR）。

---

## 6. Motion

### 既定値

- `scroll-reveal-enabled` 配下の要素（`section-header`, `feature`, `workflow-step`, `usecase`）に対して、`reveal-fade-up` または `reveal-fade-right` を 640ms / `animation-fill-mode: both` で適用。
- `--reveal-delay` をスクリプト側で要素ごとに設定（delayStep: section-header 80ms / feature 120ms / workflow-step 130ms / usecase 90ms）。
- `--reveal-x` `-28px` / `--reveal-y` `24px`。820px 以下で `--reveal-x` を `-12px` に詰める。

### 抑制条件

- `prefers-reduced-motion: reduce` が真、または `<html data-a11y-reduced-motion="true">` のとき、reveal アニメーションと hover 時の transform を無効化する。
- これは `index.astro` のスクリプト側でも初期化条件に組み込まれている：両方のチェックが揃わない場合 `IntersectionObserver` を起動しない。

### CLI command strip の typing 演出

ヒーロー右側の `.command-strip`（`tdsl check world-history.tdsl` を表示する黒い帯）は、初回表示時に「コマンドが打鍵される → `0 errors` がフェードインする」を 1 度だけ再生する。「テキストが検証されて結果が返る」流れをワークフローと同じ順序で見せるための演出で、ループはしない。

- typing は `.command-strip__command` の `max-width` を `steps(29, end)` で `0 → 30ch` までステップ送りする。文字幅は `--font-mono`（等幅）を前提に `ch` 単位で固定する。
- 結果（`.command-strip__result`）は typing 完了直後に 320ms のフェードインで現れる（`translateY(2px) → 0` を伴う）。
- 起動条件は scroll reveal と同じ：`prefers-reduced-motion: reduce` でも `data-a11y-reduced-motion="true"` でもないとき、`index.astro` の初期化スクリプトが `<body>` に `cli-strip-motion-enabled` を付与する。クラスが付かない通常状態では最終形（コマンド全文 + `0 errors`）が静止表示されるため、JS 無効環境や reduced-motion ユーザーには即座に最終状態が見える。
- DOM 上のテキストは常に最終状態で存在する。`.command-strip` 全体は `aria-hidden="true"` で SR 非対象にしているが、これはヒーロー左側のリード文と CTA で同等情報を伝えており装飾扱いとしているため。SR への露出が必要になったら `aria-hidden` を外せば最終状態が読み上げられる構造を維持している。
- 例外的に `max-width` をアニメートしている（typing 表現に必要）。`overflow: hidden` と組み合わせ、文字をクリップして段階表示する用途に限定し、他のアニメーションでは引き続き transform / opacity に絞る。

### 追加するときの注意

- 新規アニメーションは必ず `prefers-reduced-motion` と `data-a11y-reduced-motion` の両方で抑制可能にする。
- 連続再生・ループ・大きな移動量を伴うものは原則導入しない。「DSL が timeline に変換される感覚」を支援する範囲に留める（#47 のスコープ）。
- transform / opacity 以外のプロパティは原則アニメートしない。CLI command strip の `max-width` のように、typing のクリップ表現等で必要な場合は本セクションに用途を明記して導入する。

---

## 7. Accessibility

### サポートする調整軸

`<html>` のデータ属性で 3 種類の調整を提供します（`SiteHeader` の a11y メニュー、または OS 設定が起点）。

| 属性 | 値 | 効果 |
| --- | --- | --- |
| `data-a11y-reduced-motion` | `"true"` | reveal / hover の動きを抑制 |
| `data-a11y-contrast` | `"high"` | 高コントラスト配色に切替 |
| `data-a11y-text-size` | `"normal"` / `"large"` / `"extra-large"` | `--font-size-base` を 1 / 1.25 / 1.5 rem に変更 |

OS の `prefers-reduced-motion` / `prefers-contrast` も尊重しますが、ユーザーがメニューで明示的に切り替えた値が優先されます。

### フォーカス可視化

- `a:focus-visible` / `button:focus-visible` で `outline: 2px solid var(--color-accent)` を維持。
- カスタムフォーカスリングを実装する場合も、最低限 `outline-offset` を残し、コントラスト 3:1 を割らないこと。

### コントラスト

- 本文（`--color-ink` on `--color-bg`）は light / dark のどちらでも WCAG AA を満たすことを前提に変数を選んでいます。
- 補助文（`--color-muted`）はメタ情報専用。ボタンラベルや一次情報には使いません。
- 高コントラストモードは AAA 相当を目指す系統色を採用しています。

### キーボード操作

- メニュー類は `aria-expanded` / `aria-controls` を必ず付ける。
- `aria-current="page"` は現在のナビゲーション項目に付与。`SiteHeader` で `currentPath` から自動的に決まります。

---

## 8. Output SVG theme

LP 内のレンダリングプレビュー（ヒーロー右側、ユースケースカード、Playground）は現状 LP 側の lane パレット（warm / gold / plum / sky）と本体 SVG レンダラーのデフォルト配色を **手動で揃えている** 状態です。後続作業で次のいずれかの形で整合を恒久化します。

- (a) 本体側のデフォルトテーマトークンを LP のトークンと同名で公開し、LP 側でそれをそのまま参照する。
- (b) LP 側で「LP 用テーマ」を定義し、Playground のレンダリング時にテーマ引数として渡す。

採用方針は #53 の項 5 で決めます。決定までの間、本体レンダラーのデフォルト配色を変更する PR はこの DESIGN.md の lane セマンティクスを破壊しないかをレビュー観点に含めてください。

---

## 9. Files of record

決定の根拠となるファイルは以下です。DESIGN.md と乖離が出た場合、まずはこちらが現行の真実です。発見次第どちらかを更新してください。

- `site/src/styles/global.css` — トークンとレイアウトの一次定義
- `site/src/components/SiteHeader.astro` — ヘッダーと a11y メニューの実装
- `site/src/pages/index.astro` — ヒーロー / feature / workflow / usecase / install の構造
- `site/src/pages/playground.astro` — Playground の 3 ペイン構造と `?source=` プリロード
- `site/src/pages/changelog.astro` — リリース表示のテンプレート
- `site/src/lib/tdsl-wasm.ts` — Playground と Docs から WASM を呼ぶ唯一の経路

---

## Out of scope

このドキュメントは以下を **扱いません**。

- Timeline DSL 本体の DSL 文法・パーサ・WASM の API 設計
- リポジトリのリリースフロー（README.md と `.github/` を参照）
- Cloudflare Pages のデプロイ設定（README.md を参照）
- 個別 PR のスコープ判定（issue / PR で議論）
