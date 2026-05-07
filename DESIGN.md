# DESIGN.md — Timeline DSL LP / Docs サイト デザインガイドライン

このドキュメントは `site/` 配下の LP・Docs サイトが持つ既存のデザイン意図を言語化したものです。
新たなブランド再定義ではなく、現在の実装から読み取れる設計判断を記録しています。

---

## 1. Core Concept

Timeline DSL は「時系列データをテキストで書き、SVG として出力する」開発者向けツールです。
サイトのデザイントーンはこの特性から導かれています。

- **正確さと静けさ**: 派手な装飾を避け、データと図版が主役になるよう余白を確保する
- **テキスト優位**: コードサンプル・CLI 出力・タイムライン図が等しく「コンテンツ」として扱われる
- **セマンティックな色**: 各色はランド用途（王朝 / 戦争 / 人物 / 文化 / 地理）と LP コンポーネントで意味を共有し、サイトと出力 SVG のビジュアル言語を統一する
- **ダークモード・アクセシビリティをファースト**: OS 設定への自動追随と、独立した `data-a11y-*` 属性による上書きを両立させる

---

## 2. カラーパレット

カラーはすべて CSS カスタムプロパティ (`var(--color-*)`) として定義されています。
ソース: `site/src/styles/global.css`

### 2-1. Light モード (`:root`)

| トークン              | 値          | 用途                             |
| --------------------- | ----------- | -------------------------------- |
| `--color-bg`          | `#ffffff`   | ページ背景、カード背景           |
| `--color-ink`         | `#17212b`   | 本文テキスト、見出し             |
| `--color-muted`       | `#596575`   | サブテキスト、ラベル、プレース   |
| `--color-line`        | `#d8dde5`   | ボーダー、区切り線               |
| `--color-panel`       | `#f6f8fb`   | セクション背景、パネル背景       |
| `--color-accent`      | `#0d766f`   | プライマリブランドカラー (teal)  |
| `--color-accent-strong` | `#095c56` | リンク、強調テキスト             |
| `--color-warm`        | `#a74718`   | eyebrow / error / kicker        |
| `--color-gold`        | `#d69a24`   | event dot / workflow footer bar |
| `--color-plum`        | `#7b4569`   | person lane                      |
| `--color-sky`         | `#2c6f9f`   | event dot 2 / sky lane          |

### 2-2. Dark モード (`@media prefers-color-scheme: dark`)

| トークン              | 値          | 変更理由                         |
| --------------------- | ----------- | -------------------------------- |
| `--color-bg`          | `#111920`   | 暗い青みがかった黒               |
| `--color-ink`         | `#e8f0f8`   | 明るい青白                       |
| `--color-muted`       | `#8fa3ba`   | 中間輝度の青グレー               |
| `--color-line`        | `#2a3544`   | 暗い区切り線                     |
| `--color-panel`       | `#1a2434`   | やや明るい背景パネル             |
| `--color-accent`      | `#1a9e96`   | コントラスト確保のため明度を上げた teal |
| `--color-accent-strong` | `#22c4bb` | さらに明るい teal               |

> `--color-warm` / `--color-gold` / `--color-plum` / `--color-sky` はダークモードで変更しない。
> これらは SVG lane カラーと共有されており、出力物との一貫性を優先している。

### 2-3. 高コントラスト (`:root[data-a11y-contrast="high"]`)

Light / Dark それぞれに定義され、すべてのカラーを純粋な黒・白・プライマリ系色に置き換えます。

| トークン              | Light       | Dark        |
| --------------------- | ----------- | ----------- |
| `--color-bg`          | `#ffffff`   | `#000000`   |
| `--color-ink`         | `#000000`   | `#ffffff`   |
| `--color-muted`       | `#333333`   | `#cccccc`   |
| `--color-line`        | `#000000`   | `#ffffff`   |
| `--color-panel`       | `#ffffff`   | `#000000`   |
| `--color-accent`      | `#0000ff`   | `#00ffff`   |
| `--color-accent-strong` | `#000080` | `#80ffff`   |

---

## 3. タイポグラフィ

フォント定義はすべて CSS カスタムプロパティで管理されています。
日英混植を前提として和文フォールバックを各スタックに含めています。

### 3-1. フォントスタック

| トークン        | スタック (先頭から優先順)                                                                                 | 用途                                           |
| --------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `--font-display` | Avenir Next → Hiragino Sans → Hiragino Kaku Gothic ProN → BIZ UDPGothic → Yu Gothic → Noto Sans JP → system-ui | h1、section h2、page-hero h1、playground h1   |
| `--font-sans`    | Aptos → Hiragino Kaku Gothic ProN → BIZ UDPGothic → Yu Gothic UI → Yu Gothic → Noto Sans JP → system-ui | body、nav、CTA ボタン、usecase ラベル          |
| `--font-mono`    | Fira Code → SFMono-Regular → Consolas → Liberation Mono → Menlo → monospace                               | コードサンプル、panel bar、eyebrow kicker、step number、terminal |

### 3-2. フォントウェイト

| 場所                  | ウェイト |
| --------------------- | -------- |
| h1                    | 780      |
| section h2            | 760      |
| brand テキスト        | 720      |
| nav リンク            | 620      |
| eyebrow / kicker (mono) | 720–740 |

### 3-3. フォントサイズ

ベースサイズは `--font-size-base: 1rem` であり、アクセシビリティ設定で上書きできます。

| `data-a11y-text-size` 属性値 | `--font-size-base` |
| ----------------------------- | -------------------- |
| (未設定)                      | `1rem`               |
| `large`                       | `1.25rem`            |
| `extra-large`                 | `1.5rem`             |

---

## 4. レイアウト規則

### 4-1. コンテンツ幅

```
width: min(1120px, calc(100% - 2rem));
```

Playground ページのみ最大幅を広げています。

```
width: min(1280px, calc(100% - 2rem));
```

### 4-2. セクション padding

通常セクション (`.section`):

```css
padding: 3rem 0;
```

### 4-3. ブレークポイント

| 幅            | 変更内容                                                                     |
| ------------- | ---------------------------------------------------------------------------- |
| `≤ 820px`     | `.hero-inner` / `.workflow-layout` / `.install-layout` → `grid-template-columns: 1fr` |
| `≤ 820px`     | `.feature-grid` / `.workflow-rail` / `.usecase-grid` → `grid-template-columns: 1fr` |
| `≤ 820px`     | `.footer-inner` → `grid-template-columns: 1fr`                               |
| `≤ 480px`     | nav 縮小、h1 フォントサイズ縮小、各種パネルの内側余白縮小                   |

### 4-4. グリッド構成

| コンポーネント      | 列数 (デスクトップ)  | 列数 (≤ 820px) |
| ------------------- | -------------------- | --------------- |
| `.feature-grid`     | 3列                  | 1列             |
| `.workflow-rail`    | 3列                  | 1列             |
| `.usecase-grid`     | 2列                  | 1列             |
| `.hero-inner`       | 2列 (0.86fr / 1.14fr) | 1列            |
| `.workflow-layout`  | 2列 (0.78fr / 1.22fr) | 1列            |
| `.install-layout`   | 2列 (0.9fr / 1.1fr)  | 1列             |
| `.footer-inner`     | 3列 (product / nav / meta) | 1列       |

### 4-5. カード共通スタイル

```css
border-radius: 8px;
border: 1px solid var(--color-line);  /* または color-mix で調整 */
background: var(--color-bg);
```

---

## 5. コンポーネント方針

### 5-1. hero

`.hero-inner` は 2 列グリッド（左: copy、右: visual）。

右カラム (`.hero-visual`) には 3 つの浮いたパネルを重ね合わせています。

| パネル             | 役割                         |
| ------------------ | ---------------------------- |
| `.editor-panel`    | DSL エディタのモック (mono font + code-sample) |
| `.timeline-preview` | 出力 SVG プレビューのモック |
| `.command-strip`   | CLI ターミナルのモック        |

背景: `linear-gradient` で accent → gold のグラデーションを薄く重ねています。
グリッドパターンの疑似要素 (`::before`) で立体感を演出しています。

### 5-2. feature card (`.feature`)

3 列グリッド。各カードは以下の構造を持ちます。

- `.feature-kicker`: `--color-warm` / `--font-mono` の eyebrow テキスト
- `.feature-figure`: グリッドパターン背景付きのプレビュー枠 (`linear-gradient` で accent / warm の格子線)
  - 内部に `.feature-code` (コード)、`.feature-terminal` (端末)、`.feature-mini-timeline` (ミニタイムライン) のいずれか
- h3 + description

ホバー時: `border-color` の変更 + `translateY(-3px)` の浮き上がりアニメーション (160ms ease)。

### 5-3. workflow step (`.workflow-step`)

3 列グリッド (`.workflow-rail`)。各ステップの共通特徴:

- `.step-number`: `--color-accent-strong` / `--font-mono` の番号
- `::before` 疑似要素: カード下部の accent → gold → plum グラデーションバー
- `.workflow-band` 背景: accent → plum のグラデーション + panel 色

### 5-4. usecase card (`.usecase`)

2 列グリッド（左: `.usecase-map` ミニマップ、右: kicker + h3 + description）。

`.usecase-map` は格子線背景と絶対配置の `.usecase-bar` 群で構成された縮小タイムラインです。
各バーの色は SVG lane カラーと共有されます（「8. 出力 SVG の既定テーマ」参照）。

### 5-5. install band (`.install-band`)

`--color-panel` 背景の 2 列レイアウト（h2 + コマンドブロック）。
`.command-copy` はクリップボードコピー機能付きの pre + ボタン構造です。

### 5-6. playground panel (`.playground-panel`)

Playground ページ専用。3 つのワークベンチで構成されます。

| ワークベンチ              | 内容                    |
| ------------------------- | ----------------------- |
| `.editor-workbench`       | DSL テキストエリア (`#121921` 背景の `.tdsl-editor`) |
| `.preview-workbench`      | SVG プレビュー (格子線付き `.preview-surface`) |
| `.diagnostics-workbench`  | パースエラー・警告一覧  |

状態は `data-playground-state` 属性で制御されます（詳細は「7. アクセシビリティ前提」を参照）。

### 5-7. site-header / site-footer

**site-header**: `position: sticky; top: 0; z-index: 20` + `backdrop-filter: blur(14px)`。
ナビゲーションの最大幅は `min(1120px, calc(100% - 2rem))`。

**site-footer**: `.footer-inner` は 3 列グリッド（product / nav / meta）。
背景に accent → gold の薄いグラデーションを重ねています。

---

## 6. モーション方針

### 6-1. scroll-reveal

スクロールに連動して要素を表示するアニメーション。
`IntersectionObserver` で要素の可視性を監視し、`.is-visible` クラスを付与することで CSS アニメーションを起動します。

| 対象要素          | アニメーション      | delay (staggered) |
| ----------------- | ------------------- | ----------------- |
| `.section-header` | `reveal-fade-up`    | 80ms ステップ     |
| `.feature`        | `reveal-fade-right` | 130ms ステップ    |
| `.workflow-step`  | `reveal-fade-right` | 130ms ステップ    |
| `.usecase`        | `reveal-fade-up`    | 90ms ステップ     |

| アニメーション名    | 開始状態                           | 終了状態 | 時間      | イージング                    |
| ------------------- | ---------------------------------- | -------- | --------- | ----------------------------- |
| `reveal-fade-up`    | `opacity: 0; translateY(24px)`     | 通常     | 640ms     | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `reveal-fade-right` | `opacity: 0; translateX(-28px)`    | 通常     | 640ms     | 同上                          |

アニメーション完了後は `.is-revealed` クラスに置き換え、`will-change: auto` でGPU リソースを解放します。

### 6-2. ホバーアニメーション

`.feature` / `.usecase` / `.workflow-step` はホバー時に `translateY(-3px)` で浮き上がります（`transition: 160ms ease`）。

### 6-3. モーション抑制

以下のいずれかの条件でアニメーション・トランジションがすべて無効になります。

| 条件                                      | 説明                                   |
| ----------------------------------------- | -------------------------------------- |
| `@media (prefers-reduced-motion: reduce)` | OS のアクセシビリティ設定              |
| `:root[data-a11y-reduced-motion="true"]`  | サイト独自の設定（OS 設定とは独立）   |

---

## 7. アクセシビリティ前提

### 7-1. `data-a11y-*` 属性体系

`<html>` 要素またはルートの `:root` に付与する属性で、CSS カスタムプロパティと連動します。

| 属性                               | 値                         | 効果                             |
| ---------------------------------- | -------------------------- | -------------------------------- |
| `data-a11y-contrast="high"`        | —                          | カラーを純黒白系に置き換え       |
| `data-a11y-text-size="large"`      | —                          | `--font-size-base: 1.25rem`      |
| `data-a11y-text-size="extra-large"` | —                         | `--font-size-base: 1.5rem`       |
| `data-a11y-reduced-motion="true"`  | —                          | 全アニメーション・トランジション無効 |

### 7-2. フォーカス可視化

すべてのインタラクティブ要素に一貫したフォーカスリングを適用しています。

```css
outline: 2px solid var(--color-accent);
outline-offset: 3px;
border-radius: 3px;
```

### 7-3. playground 状態の視覚表現

`data-playground-state` 属性で playground 全体の状態を色で示します。

| 属性値    | ボーダー色        | ラベル色              | 意味           |
| --------- | ----------------- | --------------------- | -------------- |
| `ready`   | `--color-accent`  | `--color-accent-strong` | 正常           |
| `warn`    | `--color-gold`    | `#845d0c`             | 警告あり       |
| `error`   | `--color-warm`    | `--color-warm`        | エラーあり     |

---

## 8. 出力 SVG の既定テーマ — lane カラーと LP パレットの対応

Timeline DSL が出力する SVG の lane 色は LP のカラーパレットと共有されています。
これにより、サイト上のプレビューと実際の出力物が一貫したビジュアル言語を持ちます。

| CSS クラス / トーン   | CSS トークン      | Light 値    | 意味 (代表的な用途)              |
| --------------------- | ----------------- | ----------- | -------------------------------- |
| `.span-realm` / `accent` | `--color-accent` | `#0d766f`  | 王朝・統治期間・主要スパン       |
| `.span-war` / `warm`  | `--color-warm`    | `#a74718`  | 戦争・紛争・エラー系             |
| `.span-person` / `plum` | `--color-plum`  | `#7b4569`  | 人物・在位期間                   |
| `gold`                | `--color-gold`    | `#d69a24`  | 文化・出来事・警告系             |
| `sky`                 | `--color-sky`     | `#2c6f9f`  | 地理・地域                       |

これらのトークンはダークモードで変更されません（LP テキスト色とは異なり、SVG 出力と LP 上のプレビューの対応を保つためです）。

高コントラストモードでは `--color-warm` / `--color-gold` / `--color-plum` / `--color-sky` も暗色系に置き換えられます。
SVG 出力に高コントラストパレットを適用する場合は `data-a11y-contrast="high"` 下の CSS 変数値を参照してください。

---

## ファイル参照

| ファイル                            | 内容                               |
| ----------------------------------- | ---------------------------------- |
| `site/src/styles/global.css`        | カラー・タイポ・レイアウト・コンポーネント CSS の全量 |
| `site/src/pages/index.astro`        | LP の HTML 構造                    |
| `site/src/pages/playground.astro`   | Playground の HTML 構造            |
| `site/src/pages/changelog.astro`    | Changelog の HTML 構造             |
| `site/src/components/SiteHeader.astro` | ヘッダーコンポーネント          |
| `site/src/components/SiteFooter.astro` | フッターコンポーネント          |
