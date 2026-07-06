# DESIGN.md

> **English summary**: This document records the design decisions for the `timeline-dsl-lp` site (LP + Docs). Three core principles guide every decision: **Source as truth** (the site reflects Timeline DSL's text-driven philosophy — code, commands, and rendered output appear side-by-side); **Editor first** (primary audience is developers and educators, so readability and CLI output fidelity take priority over decoration); **Calm density** (sections stack in a fixed order — hero → features → workflow → use cases → install — with one message per section). Colors are defined as CSS custom properties in `site/src/styles/global.css`; always reuse existing tokens before adding new ones. Typography relies on the Starlight system font stack with `--font-code` for monospace. When in doubt, choose honesty over spectacle and code legibility over visual flourish.

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

lane 色のバー（`.span-block` / `.mini-span` / `.usecase-bar`）に乗る前景は `--color-on-lane`（`#ffffff`）に集約します。lane 背景は light / dark とも有色・暗色のため白が最適前景で、terminal と同じく **テーマ非依存**（`:root` に 1 度だけ定義し、dark / high-contrast でも override しない＝白が最大コントラスト）。ただし **gold lane 上の白はコントラスト未達**（通常 light で `#d69a24` 背景に対し 2.47:1 = AA 未達、light HC で `#806000` に対し 5.85:1 = AAA 未達）です。これは前景（白）ではなく lane 背景（`--color-gold`）側の濃度に起因し、`--color-gold` の引き上げは lane セマンティクス（周年 = gold）の維持と両立させる必要があるため、後続 issue で別途扱います。

### Dark mode

`@media (prefers-color-scheme: dark)` で以下を上書きします。lane パレットも dark 背景（`#111920`）向けに再定義します（light 値の流用ではコントラスト・色相整合が崩れるため）。

| Token | Value |
| --- | --- |
| `--color-bg` | `#111920` |
| `--color-ink` | `#e8f0f8` |
| `--color-muted` | `#8fa3ba` |
| `--color-line` | `#2a3544` |
| `--color-panel` | `#1a2434` |
| `--color-accent` | `#1a9e96` |
| `--color-accent-strong` | `#22c4bb` |

dark base の lane パレットは、白前景（`--color-on-lane` `#ffffff`）に対し AA（4.5:1）以上、かつ暗背景でバーが視認できる輝度（vs `#111920` ≥ 3:1）を満たす値へ調整します。warm=起点 / gold=周年 / plum=人物 / sky=外部要因 の色相は維持します。

| Token | Value | 白前景に対する比 | 背景 `#111920` に対する比 |
| --- | --- | --- | --- |
| `--color-warm` | `#b8501c` | 5.00:1 | 3.55:1 |
| `--color-gold` | `#9a6a12` | 4.73:1 | 3.75:1 |
| `--color-plum` | `#915581` | 5.50:1 | 3.23:1 |
| `--color-sky` | `#2f7bb0` | 4.58:1 | 3.87:1 |

### High-contrast variant

`:root[data-a11y-contrast="high"]`（light）では Windows ハイコントラストに近い系統色（純青 `#0000ff` / 純黒 `#000000` 等）に切り替えます。lane の色も同じ規則で、背景 `#ffffff` に対し画面上で確実に区別できる飽和色に置換します。新色は WCAG AAA（7:1）を目標、最低でも AA（4.5:1）を満たします。

| Token | Value | 背景 `#ffffff` に対するコントラスト比 |
| --- | --- | --- |
| `--color-accent` | `#0000ff` | 8.59:1 |
| `--color-accent-strong` | `#000080` | 16.01:1 |
| `--color-warm` | `#800000` | 10.95:1 |
| `--color-gold` | `#806000` | 5.85:1 |
| `--color-plum` | `#600060` | 12.60:1 |
| `--color-sky` | `#00557a` | 8.14:1 |

`--color-sky` は外部要因 lane のセマンティクスを保つため青系（natural の `#2c6f9f` に近い色相）を維持しつつ、cyan 成分を持たせて純青の accent（`#0000ff` / `#000080`）と色相で区別します（過去は accent-strong と同じ `#000080` で同色衝突していた）。

`--color-gold`（5.85:1）は AAA 未達・AA 充足の **既存値**であり、今回の同色衝突解消の対象外です。AAA への引き上げ可否は #210 の後続 sub-issue で検討します。

dark の `@media (prefers-color-scheme: dark)` 下の high-contrast ブロックでも lane パレットを再宣言します（**解消済み**）。light HC 値（warm `#800000` 等）は黒背景（`#000000`）で沈むため流用せず、黒背景でバーが視認でき（vs 黒 ≥ 3:1）かつ白前景で AA 以上を満たす値へ置換します。warm=起点 / gold=周年 / plum=人物 / sky=外部要因 の色相は維持します。

| Token | Value | 白前景に対する比 | 背景 `#000000` に対する比 |
| --- | --- | --- | --- |
| `--color-warm` | `#c0461a` | 5.08:1 | 4.13:1 |
| `--color-gold` | `#8f6410` | 5.25:1 | 4.00:1 |
| `--color-plum` | `#8a4f76` | 6.07:1 | 3.46:1 |
| `--color-sky` | `#2f78ac` | 4.77:1 | 4.40:1 |

白前景 AAA（7:1）と vs 黒 3:1 は輝度帯が重ならず両立しないため、白前景は AA（4.5:1）以上を確保しつつ、バー可視性（vs 黒）を優先します。

### Terminal surface

ヒーローの `.terminal` / `.command-strip`、feature カードの `.feature-terminal` / `.diagnostic` は **意図的に dark** な面です。ページテーマ（light / dark）に依存せず常に暗色で、コードや CLI 出力を「実行環境」として見せるための演出です。色は `--color-terminal-*` トークンに集約します。

| Token | Value | 用途（由来） |
| --- | --- | --- |
| `--color-terminal-bg` | `#121921` | terminal / command-strip / feature-terminal の背景 |
| `--color-terminal-ink` | `#eaf1f8` | terminal 上の主要テキスト |
| `--color-terminal-border` | `#cdd4df` | `.terminal` の外枠（ページ側との境界） |
| `--color-terminal-shadow` | `rgba(21, 32, 44, 0.16)` | `.terminal` のドロップシャドウ色 |
| `--color-terminal-bar-border` | `rgba(255, 255, 255, 0.1)` | terminal-bar / feature-command の内部区切り線 |
| `--color-terminal-dot` | `#738090` | ウィンドウ操作ドット（既定） |
| `--color-terminal-dot-warm` | `#df6a54` | ウィンドウ操作ドット（close 相当） |
| `--color-terminal-dot-gold` | `#d8ad43` | ウィンドウ操作ドット（minimize 相当） |
| `--color-terminal-dot-green` | `#58a96d` | ウィンドウ操作ドット（maximize 相当） |
| `--color-terminal-prompt` | `#72d8c9` | プロンプト記号 |
| `--color-terminal-output` | `#aeb9c5` | terminal 出力行のテキスト |
| `--color-terminal-diag-muted` | `#b8c4d1` | diagnostic リストのラベル列 |
| `--color-terminal-ok` | `#8de0a2` | diagnostic ok / command-strip 強調（成功） |
| `--color-terminal-warn` | `#e0bd66` | diagnostic warn（警告） |
| `--color-terminal-error` | `#ff947d` | diagnostic error（エラー） |

**テーマ非依存の例外**: terminal サーフェスは light / dark で同一見た目が仕様のため、`--color-terminal-*` は `:root` に **1 度だけ** 定義し、dark base ブロック（`@media (prefers-color-scheme: dark)` 直下の `:root`）では再定義しません。§2 末尾「使用ルール」の "3 系統同時定義" のうち dark 相当は base ではなく **high-contrast dark ブロックで担保** します（これは terminal に限った明示的な例外です）。

**ウィンドウ操作ドットは lane ではありません**。`dot-warm` / `dot-gold` / `dot-green` は macOS 風の close / minimize / maximize を模した信号色で、lane パレット（起点 / 周年 / 人物 / 外部要因）のセマンティクスとは無関係です。lane トークンを参照しないことで意味の混線を避けています。

**High-contrast**: terminal は HC でも dark を維持するため、背景 `#ffffff` 向けに暗くした lane HC 値（上表）はそのまま使えません。`:root[data-a11y-contrast="high"]`（light HC）と dark HC ブロックの **両方** で、near-black（`#000000`）面に乗る明るい飽和色へ上書きします。全色を背景 `#000000` に対し WCAG AAA（7:1）以上で揃えています。

| Token | HC Value | 背景 `#000000` に対するコントラスト比 |
| --- | --- | --- |
| `--color-terminal-bg` | `#000000` | — |
| `--color-terminal-ink` | `#ffffff` | 21.00:1 |
| `--color-terminal-border` | `#ffffff` | 21.00:1 |
| `--color-terminal-shadow` | `transparent` | —（HC では影を無効化） |
| `--color-terminal-bar-border` | `rgba(255, 255, 255, 0.6)` | —（半透明を上げて視認性確保） |
| `--color-terminal-dot` | `#d8e0e8` | 15.75:1 |
| `--color-terminal-dot-warm` | `#ff8a75` | 9.14:1 |
| `--color-terminal-dot-gold` | `#ffd24a` | 14.57:1 |
| `--color-terminal-dot-green` | `#5fe08a` | 12.52:1 |
| `--color-terminal-prompt` | `#5ff0e0` | 15.03:1 |
| `--color-terminal-output` | `#d8e0e8` | 15.75:1 |
| `--color-terminal-diag-muted` | `#d8e0e8` | 15.75:1 |
| `--color-terminal-ok` | `#7dffa0` | 16.68:1 |
| `--color-terminal-warn` | `#ffd24a` | 14.57:1 |
| `--color-terminal-error` | `#ff8a75` | 9.14:1 |

ok / warn / error は HC で輝度が近接するため、**色相（緑 / 黄 / 赤橙）で区別** します。輝度差ではなく色相分離に依存する設計のため、smoke では 3 値が相互に異なること（等値でないこと）と `bg ≠ ink` を回帰防止アサーションとして検証します。HC では output / diag-muted / dot 既定を `#d8e0e8` に集約しています（暗色面上の可読性を最優先するため）。

### Status colors（playground）

playground のステータス文字（`[data-playground-state="..."] .playground-status`）は `--color-bg` 上に乗る **テーマ依存** の前景です。ready は `--color-accent-strong` を再利用し、warn / error は専用トークン（`--color-status-warn` / `--color-status-error`）を持ちます。`--color-gold`（light `#d69a24`）は白背景で約 2:1、`--color-warm`（light `#a74718`）は dark 背景で約 3:1 とそれぞれテキスト不適のためトークン化しています。warn / ready / error は色相（amber / teal / 赤橙）で区別します。

| テーマ | `--color-status-warn` | `--color-status-error` |
| --- | --- | --- |
| light | `#845d0c`（白に 5.90:1 / AA） | `#c62828`（白に 5.62:1 / AA） |
| dark | `#e6c46e`（`#111920` に 10.55:1 / AAA） | `#ff8a78`（`#111920` に 7.74:1 / AAA） |
| light HC | `#5c4500`（白に 9.11:1 / AAA） | `#960000`（白に 9.14:1 / AAA） |
| dark HC | `#ffd24a`（黒に 14.57:1 / AAA）。terminal-warn HC と同値 | `#ff8a75`（黒に 9.14:1 / AAA）。terminal-error HC と同値 |

**error の dark 適応（解消済み）**: 従来 error は `--color-warm` を再利用しており、dark base では `#a74718` が `#111920` 上で 3.01:1（AA 未達）でした。専用トークン `--color-status-error` を 4 系統で定義して解消しています。warn を dark で明色化したことで warn > error の輝度逆転が残りますが、これは可読性優先の**意図的なトレードオフ**で、両者は色相（amber vs 赤橙）で区別可能です。

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

OS フォントへのフォールバックを前提にしています。Web フォントの self-host は **現時点では採用しない** 判断です。判断の根拠と再検討トリガーは「コードフォントの self-host 判断」を参照してください。

### コードフォントの self-host 判断

\`--font-mono\` の Web フォント self-host（JetBrains Mono / Fira Code を WOFF2 で配信する案）は #71 で検討した結果、**現時点では採用しません**。判断の理由と、次に再検討すべき条件を以下に固定化します。

#### 不採用の理由

- **既存スタックで実害が観測できない**。ヒーロー、feature card、Playground、Docs のコードブロックはいずれも `--font-mono` の OS フォールバック（`Fira Code` がインストールされていれば優先、なければ `SFMono-Regular` / Consolas / Menlo / Liberation Mono / monospace に順次フォールバック）でコード可読性に問題が出ていない。`palt` を当てない限り等幅であり、Shiki / Expressive Code のシンタックスハイライト（`<Code lang="tdsl">` 経路、Docs の Expressive Code 経路の双方）も正常に機能している。
- **ブランド要件として未確立**。Editor first / Calm density（§1）が掲げる軸は「コード片の可読性」であって「コードフォントの統一感」ではない。OS 別の差異が**初見でブランドが揺らぐレベル**にはなっていない。
- **self-host が連れてくる運用負債**。WOFF2 配置（`site/public/fonts/`）、`@font-face` の light/dark 双方での挙動確認、SIL OFL ライセンスファイルの同梱、subset 化（latin + punctuation）、ビルド時の最適化、Cloudflare Pages 配信での `Cache-Control` 設定、追加 HTTP リクエストや FOUT/FOIT のレビューが必要になる。これらは**ブランド要件が確立していない段階で抱えるには重い**。
- **CLS / LCP 観点の見立て**。`font-display: swap` で CLS は抑制可能だが、現状すでに OS フォントで即時 paint しており LCP の改善幅は限定的と推定される。Lighthouse / WebPageTest による before/after の定量計測は、self-host を採用したい根拠が先に立ってからやるべき作業（先に計測しても、不採用根拠を覆す材料にはならない）。

#### 再検討するトリガー

以下のいずれかが起きたら本判断を上書きする前提で、再検討時にこのリストを必ず参照する。

1. **コードフォントの統一感がデザインの一次要件になる**：例えば LP がコードショーケース寄りに大きく傾く、または `Calm density` から `Code-first identity` に方針転換する判断が出る。
2. **Fira Code のリガチャを意図的にブランド要素として使う方針が立つ**：OS フォールバックの大半（`SFMono-Regular` / Consolas）はリガチャを持たないため、視覚仕様が揃わないと議論にならない。
3. **コード片の表示量が大幅増**：Gallery（#68）の本格運用や、Docs の長尺コードブロックが LP の主役になる比重がはっきり上がった場合。
4. **計測でコード片の閲覧体験が悪化していることが示される**：例えば実機計測で「ある OS / ブラウザ組み合わせでコード片の readability が他環境比で明確に劣る」ことが定量的に確認できた場合。

#### 採用時に決めるべきこと（メモ）

将来採用に転じる際は以下を **同時に決めて記録**する：

- 採用フォント（JetBrains Mono / Fira Code のいずれか、ライセンス SIL OFL）と weight 構成
- 配置先（`site/public/fonts/`）と `@font-face` での `font-display: swap` 適用、`font-feature-settings` の指定
- subset 戦略（latin + punctuation で十分か、`-` `..` `=>` 等の DSL 記号を明示的に含めるか）
- `--font-mono` スタックの先頭への追加（OS インストール済みフォントよりも self-host を優先するかを含む）
- CLS / LCP の before/after を `pnpm build` 後の dist で測定し、回帰がないことを確認
- 本セクション（§3 コードフォントの self-host 判断）を「採用済み」に書き換え、不採用ロジックは履歴として残さない

### 用途別の使い分け

| 用途 | フォント | 補足 |
| --- | --- | --- |
| ヒーロー H1・セクション H2 | `--font-display` | weight 760 / line-height 1.15 |
| 本文・段落 | `--font-sans` | line-height 1.65、`font-feature-settings: "palt" 1` |
| アイブロウ（kicker） | `--font-mono` | uppercase、letter-spacing をやや広めに |
| コード片・CLI 出力・年数ラベル | `--font-mono` | リガチャは抑制せず標準で許容 |
| パンくず・メタ情報 | `--font-sans` | `--color-muted` で弱める |

### サイズの基準

ベースフォントサイズは `--font-size-base`（標準 `1rem`）。a11y メニューで `large` (`1.25rem`) / `extra-large` (`1.5rem`) に切り替わります。すべての font-size はこれを基準にした相対値で書き、px 直値は使いません。font-size は spacing / radius のような段階値トークンにはせず、`rem` 直値（相対値）のまま扱います。見出しサイズは要素ごとに固有で段階スケールに乗らないため、トークン化の対象外とします。

主要見出し：

- `.page-hero h1`: `4.3rem`
- `.section-header h2`: `2.25rem`（weight 760）
- `.lead`（リード文）: max-width `42rem`、本文と同サイズ

---

## 4. Layout

### Page shell

- セクションの最大幅: `var(--layout-width)`（= `min(1120px, calc(100% - 2rem))`）。`.nav` / `.section` / `.page-hero-inner` / `.footer-inner` が共有する。
- セクションの縦 padding: 通常 `3rem 0`、ページヒーローは `clamp(2.2rem, 4vw, 3.5rem) 0`
- 文章ブロックの max-width: `42rem`〜`48rem`（読みやすさ優先で延ばさない）

### Spacing

`gap` / `margin` / `padding` は次の段階値トークンを基本とします。中間値の濫用は避けます。トークンは `global.css` の `:root` に定義され、テーマ（light / dark / high-contrast）非依存です。

| Token | Value |
| --- | --- |
| `--space-2xs` | `0.35rem` |
| `--space-xs` | `0.5rem` |
| `--space-sm` | `0.7rem` |
| `--space-md` | `1rem` |
| `--space-lg` | `1.5rem` |
| `--space-xl` | `2rem` |
| `--space-2xl` | `2.7rem` |

既存コードにはスケール外の中間値（`0.9rem` 等）が残っています。これらはその箇所固有の意図を持つ実測値であり、無理にスケールへ丸めません（見た目を変えないため）。新規コードはトークンを既定とし、スケール外の値は必要なときだけ直値で書きます。

### Radius

`global.css` の `:root` に定義する 5 段階トークン。状況に応じて選びます。

| Token | Value | 用途 |
| --- | --- | --- |
| `--radius-xs` | `3px` | 細い装飾線 |
| `--radius-sm` | `4px` | バッジ・タグ |
| `--radius-md` | `6px` | ボタン・小要素 |
| `--radius-lg` | `8px` | カード・パネル |
| `--radius-pill` | `999px` | ピル状の lane バー・dot |

### Breakpoints

- `820px`: タブレット以下。ヒーローや usecase グリッドが縦積みになる境界。
- `480px`: モバイル。文字サイズと padding を更に詰める。

`@media (hover: hover)` でホバー演出のみを切り替える方針も維持します。タッチデバイスで hover 残留が出ないように。

---

## 5. Components

主要コンポーネントの責務と維持したい振る舞いです。

### ヘッダー構成方針

LP / Playground / Changelog と Docs では、ヘッダーの実装経路が異なります。

| ページ | ヘッダー実装 | 理由 |
| --- | --- | --- |
| LP (`/`) / Playground (`/playground/`) / Gallery (`/gallery/`) / Changelog (`/changelog/`) | `SiteHeader.astro` を直接利用 | 独立ページであり、ナビゲーション・a11y メニューをフルコントロールする必要があるため |
| Docs (`/docs/...`) | Starlight 標準 `Header` ＋ コンポーネント個別 override（`SocialIcons` / `Search`） | Starlight が提供するサイドバートリガー・モバイルメニュー・テーマ/言語切替を壊さず、UX 差のある要素だけを個別に差し替えるため |

Docs ヘッダーの a11y メニューは `DocsA11yMenu.astro`（`components.SocialIcons` として登録）で提供します。GitHub ソーシャルリンクも同コンポーネント内に含めているため、`astro.config.mjs` の `social` 配列は表示先を `DocsA11yMenu.astro` が担います。検索 UI は `DocsSearch.astro`（`components.Search` として登録、#299）で LP の `SiteSearch.astro` と同じ dialog + Pagefind + Ctrl/Cmd+K に揃えています。

`localStorage` キー `tdsl-a11y-settings` と `<html>` の `data-a11y-*` 属性の仕様は `SiteHeader.astro` と共通です。Docs で保存した設定は LP / Playground / Changelog でもそのまま引き継がれます（同じキーを読み書きするため）。

#### 方針 A（Starlight Header 全面置換）の PoC 結果と段階移行プラン

Starlight の `components.Header` を `SiteHeader.astro` に全面差し替える「方針 A」の実現可能性を PoC（Starlight 0.39.2 で実機検証、#300）で評価しました。結論として **方針 B（コンポーネント個別 override）を継続**します。以下は判断の根拠と、将来 A に移行する場合の段階プランです。

**PoC で判明した実態（旧前提条件リストの訂正を含む）**

1. **`Header.astro` が内包するのは 5 つの virtual component のみ**: `SiteTitle` / `Search` / `SocialIcons` / `ThemeSelect` / `LanguageSelect`。`MobileMenuToggle` は **`Header` の外**（`PageFrame.astro` が `<header>` slot の兄弟として描画）にある。
   → **`components.Header` を差し替えてもモバイルサイドバートグルは影響を受けない**。旧前提条件「モバイルトグル維持が必要」は過大評価だった。
2. **レイアウト枠は `PageFrame.astro` 側が提供**: `<header>` の `height: var(--sl-nav-height)` / `position: fixed` / `padding: var(--sl-nav-pad-*)` / `background: var(--sl-color-bg-nav)` は PageFrame が持つ。置換 Header は slot を埋めるだけで、`--sl-nav-height` を尊重すれば収まる。
3. **個別 override で UX 差はほぼ解消済み**: `Search`（#299 / DocsSearch.astro）と `SocialIcons`（DocsA11yMenu.astro）の 2 点で、Docs と LP の検索体験・a11y メニューは既に一致。残る差分は `SiteTitle` / nav links（TOP_NAV）/ `ThemeSelect` / `LanguageSelect` の見た目のみ。

**前提条件 3 点の実装難度・リスク（PoC 評価）**

| 前提 | 難度 | リスク | 備考 |
| --- | --- | --- | --- |
| `SiteTitle`/`Search`/`ThemeSelect`/`LanguageSelect` の自前化 | 中 | 中 | `Search` は実証済み。`ThemeSelect`/`LanguageSelect` は Starlight の状態管理（`localStorage` / `data-theme`）を再実装する必要があり、回帰リスクの主因 |
| `--sl-*` 変数尊重のレイアウト | 低 | 低 | PageFrame が枠を提供するため slot 内で `--sl-nav-height` に従うだけ |
| モバイルサイドバートグル維持 | — | なし | `Header` 外（PageFrame）にあり置換の影響範囲外 |

**段階移行プラン（将来 A が必要になった場合）**

1. **Phase 0（完了済み）**: 個別 override で UX 差を解消（`SocialIcons` = a11y メニュー、`Search` = #299）。
2. **Phase 1**: `ThemeSelect` / `LanguageSelect` を個別 override で LP 体裁に寄せる（まだ Header 全面置換はしない）。状態管理は Starlight 標準を温存し見た目だけ合わせる。
3. **Phase 2**: `SiteTitle` を override し、ロゴ + nav links（TOP_NAV）を Docs ヘッダーへ追加。ここまでで「見た目は SiteHeader、土台は Starlight Header」になる。
4. **Phase 3（A 完遂）**: 全要素が override 済みになった時点で `components.Header` 自体を `SiteHeader.astro` に差し替え、内部で各 override 済みコンポーネントを再利用する。

各 Phase は独立 PR で出し、`pnpm smoke:a11y`（フォーカストラップ・aria 回帰）と検索・言語切替・テーマ切替の手動確認を回帰チェックに含める。

**A/B 判断（最新）**: Phase 0 完了により方針 B が UX 統一の主要目的をほぼ達成したため、**方針 B を継続**する。方針 A への移行は「Docs ヘッダーに LP の nav links を出す」等の明確な要求が出た時点で Phase 1 から段階的に着手する（一括置換はしない）。

### `SiteHeader`

- LP / Playground / Changelog の共通ヘッダー。各ページから `SiteHeader currentPath="..."` で利用。
- 内部にアクセシビリティメニューのトグルを持つ（reduced motion / 高コントラスト / 文字サイズ）。設定は `localStorage` (`tdsl-a11y-settings`) に保存し、`<html>` の `data-a11y-*` 属性として適用される。

### `DocsA11yMenu`

- Starlight の `components.SocialIcons` として登録し、Docs ヘッダーに a11y メニューを追加するコンポーネント（`site/src/components/DocsA11yMenu.astro`）。
- `SiteHeader.astro` と同一の `localStorage` キー・`data-a11y-*` 属性仕様を使うため、サイト全体で設定が共有される。
- スタイルは Starlight の CSS 変数（`--sl-color-*`）を参照するため、Starlight の light / dark テーマ切替に追従する。

### `DocsSearch`

- Starlight の `components.Search` として登録し、Docs の検索 UI を LP の `SiteSearch.astro` に揃えるコンポーネント（`site/src/components/DocsSearch.astro`、#299）。
- LP と同じ `<dialog>` + Pagefind UI の遅延初期化 + `Ctrl`/`Cmd`+`K` ショートカットを提供し、ページ間の検索体験差をなくす。インデックスは Starlight と共通の Pagefind。
- スタイルは Starlight の CSS 変数（`--sl-color-*`）を参照し、`DocsA11yMenu.astro` と同じ変数体系で light / dark テーマに追従する。

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
- **エディタは CodeMirror 6 ベース** (#66): `@codemirror/state` / `@codemirror/view` / `@codemirror/commands` / `@codemirror/language` を使用。`<textarea>` から移行し、行番号・アクティブライン強調・ブラケットマッチング・undo/redo を提供する。
  - テーマはインライン `EditorView.theme()` で LP デザイントークン（`--font-mono`・`#121921` 背景・`#eaf1f8` テキスト）に合わせる。
  - `prefers-reduced-motion: reduce` / `data-a11y-reduced-motion="true"` 時は `.cm-cursor` の点滅アニメーションを `animation: none !important` で無効化する。
- **検証フローの視覚フィードバック** (#74): `data-playground-state` の値に応じてフィードバックを段階的に提供する。`<main data-playground-root>` の初期値は `"loading"` に設定してある。
  - `loading`: status 欄の `::before` に `pg-spin` スピナーを表示。preview pane を `opacity: 0.5` にして「再構築中」を示す。
  - `ready`: status 欄で accent 色の background flash（`pg-flash-ready`, 350ms）。
  - `warn`: status 欄で gold 色の background flash（`pg-flash-warn`, 350ms）。
  - `error`: status 欄で warm 色の background flash（`pg-flash-error`, 400ms）。
  - `prefers-reduced-motion: reduce` / `data-a11y-reduced-motion="true"` 時はスピナーと flash アニメーションを無効化するが、色変更（`border-left-color` / `color`）と `opacity` 変化は維持する。

### Gallery (`/gallery/`)

- サンプル年表一覧ページ（`site/src/pages/gallery.astro`）。サンプルデータは `site/src/data/gallery-samples.json` で管理する。
- 各カードは **2 ペイン構成**：左に Shiki でハイライトした `.tdsl` ソース、右に WASM でクライアントサイドレンダリングした SVG プレビュー。SVG は非同期でロードし、ローディング中はドットアニメーションのプレースホルダーを表示する。
- `?source=` パラメータ付きの「Edit this example」ボタンで Playground にプリロードできる（Playground の `applySource` 機構を再利用）。
- `prefers-reduced-motion: reduce` および `data-a11y-reduced-motion="true"` 時はローディングアニメーションを無効化する。
- サンプルを追加するときは `gallery-samples.json` にエントリを追加するだけで良い（ページ側の変更は不要）。lane パレットのセマンティクス（§2）に従って `.tdsl` を書く。

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

### Playground 状態フィードバック (#74)

- `pg-spin`: Playground の `loading` 状態中、status `::before` に適用する 0.65s linear infinite スピナー。reduced motion で `animation: none` に。
- `pg-flash-{ready,warn,error}`: 検証完了・警告・エラー時に status 欄の background で状態色フラッシュ（350–400ms, `ease-out`, `animation-fill-mode: both`）。フラッシュ後は静止状態と同じ外観に戻る。reduced motion では `animation: none` にするが、`border-left-color` と `color` による色変更は維持される。

### Feature card ミニタイムライン組み上がり (#73)

feature card 内の `.feature-mini-timeline`（"Render" visual）に限定して、「年表が組み上がる」感覚を 3 段階で演出します。

- **軸ラベル** (`.mini-ticks`): `mini-axis-grow`（400ms, delay 100ms）— 左からフェードイン。
- **lane** (`.mini-lane:nth-child(1/2)`): `mini-lane-appear`（350ms, delay 200ms / 280ms）— 下からフェードイン、2 本が並列出現。
- **span バー** (`.mini-span`): `mini-span-appear`（400ms, delay 380ms）— 左からフェードイン。

feature 本体の `reveal-fade-right`（640ms）と同タイミングで走り始め、内部要素は feature reveal の途中から段階的に着地します。抑制条件は既存と同様：`scroll-reveal-enabled` クラスが付かないとき（`motionAllowed` が false のとき）は一切アニメートしません。

### 追加するときの注意

- 新規アニメーションは必ず `prefers-reduced-motion` と `data-a11y-reduced-motion` の両方で抑制可能にする。
- 連続再生・ループ・大きな移動量を伴うものは原則導入しない。「DSL が timeline に変換される感覚」を支援する範囲に留める（#47 のスコープ）。
- transform / opacity 以外のプロパティは原則アニメートしない。CLI command strip の `max-width` のように、typing のクリップ表現等で必要な場合は本セクションに用途を明記して導入する。

---

## 7. Accessibility

### サポートする調整軸

`<html>` のデータ属性で 4 種類の調整を提供します（`SiteHeader` / `DocsA11yMenu` の a11y メニュー、または OS 設定が起点）。
設定のロジックは `site/src/lib/a11y-settings.ts` に集約し、`localStorage` キー `tdsl-a11y-settings` で永続化します。

| 属性 | 値 | 効果 |
| --- | --- | --- |
| `data-a11y-reduced-motion` | `"true"` | reveal / hover の動きを抑制 |
| `data-a11y-contrast` | `"high"` | 高コントラスト配色に切替 |
| `data-a11y-text-size` | `"normal"` / `"large"` / `"extra-large"` / `"xx-large"` | `--font-size-base` を 1 / 1.25 / 1.5 / 2 rem に変更（WCAG 1.4.4 Resize Text） |
| `data-a11y-text-spacing` | `"enhanced"` | `--letter-spacing-base: 0.12em` / `--word-spacing-base: 0.16em` に変更（WCAG 1.4.12 Text Spacing） |

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

LP 内には「色付きの年表ビジュアル」を見せる場所が 2 系統あり、現状は **別経路で並走**しています。揃っているように見えますが、配色は技術的にはリンクしていません。

| 場所 | 描画経路 | 配色源 |
| --- | --- | --- |
| ヒーロー右側のミニタイムライン / ユースケースカード | LP 側で HTML + CSS により再現 | `global.css` の lane palette（`--color-warm` / `--color-gold` / `--color-plum` / `--color-sky`） |
| Playground のレンダリング SVG | `tdsl_wasm.render_svg_from_source(source, scale)` | 本体 WASM レンダラー内蔵のデフォルトテーマ（後述） |

### 現状の WASM デフォルト配色（実測）

`render_svg_from_source` が `circle.tdsl-event-dot` の `style="fill:#..."` 等として出力するハードコード値は次の 4 色で、lane の出現順に循環適用されます。

| 順 | hex | LP lane palette との対応 |
| --- | --- | --- |
| 1 | `#27AE60`（緑） | LP 側に対応色なし |
| 2 | `#4682B4`（steel blue） | `--color-sky` (`#2c6f9f`) に意味的に近い |
| 3 | `#8E44AD`（紫） | `--color-plum` (`#7b4569`) に意味的に近い |
| 4 | `#E67E22`（オレンジ） | `--color-warm` (`#a74718`) に意味的に近い |

LP 側の `--color-gold`（周年・節目）に相当する色は WASM 側に存在せず、また WASM 1 番目の緑は LP 側に対応がありません。さらに WASM 側は順序ベース（`order` ではなく lane の出現順）で、LP の **意味付き**（warm = 起点 / gold = 節目 / plum = 人物 / sky = 地理）と**対応軸が違います**。

### 採用方針（短期 / 中期）

- **短期（本リポジトリ単独で完結する範囲）**: 2 系統が並走している事実を受け入れ、各々の場所で lane の意味割り当てを **DESIGN.md §2 のセマンティクスに従って手動で揃える**ことだけを保証します。Playground のレンダリング SVG は本体 WASM の出力を改変しません（インライン style に LP 側 CSS から override をかける誘惑には乗らない。WCAG コントラストを壊し、本体側の更新で容易に乖離するため）。
- **中期（本体 [`timeline-dsl`](https://github.com/keroway/timeline-dsl) repo への依頼が前提）**: **(a) named theme tokens を本体側で公開し、LP 側で同名トークンを参照する** 案を主案とします。具体的には、`render_svg_from_source` が出力する SVG の `<style>` に `--tdsl-lane-warm` / `--tdsl-lane-gold` / `--tdsl-lane-plum` / `--tdsl-lane-sky` のような **意味付きの CSS variables** を吐き、LP 側で `:root` の lane palette を同名でプロキシする運用です。dark mode / high-contrast の追従も LP 側 token を変えるだけで済むため整合性が高い。
- **(b) Playground レンダリング時にテーマ引数を渡す**は取り下げます。`render_svg_from_source` の API 表面を広げる必要があり、theme は環境（LP / Docs / 第三者組み込み）ごとに自由なため、CSS variables 経由で外から差し替えられる (a) のほうが API として薄く運用が楽。

### 本体 repo への提案メモ

中期案を進める際は本体 repo に以下の趣旨で issue を起票してください（起票済み: [keroway/timeline-dsl#485](https://github.com/keroway/timeline-dsl/issues/485)）。

- 出力 SVG の `<style>` に `--tdsl-lane-*`（warm / gold / plum / sky など lane セマンティクス相当）の CSS variables を定義し、デフォルト値として現行の hex を保持する。
- `tdsl-event-dot` / `tdsl-event-stem` / `tdsl-lane-band-*` 等の class が `var(--tdsl-lane-*, #fallback)` を参照する形に置き換える。
- LP 側 `global.css` で同名トークンを公開し、`prefers-color-scheme: dark` と `data-a11y-contrast="high"` でも追従させる。
- 4 色循環 → セマンティクス対応への移行については別議論（lane に `tags` で意味を渡す / lane id 命名規約に乗せる等の選択肢あり）。

### 実装状態（v1.20.0 同期後 · #303）

中期案 (a) は **実装済み**。本体 [keroway/timeline-dsl#485](https://github.com/keroway/timeline-dsl/issues/485)（PR #486）が v1.20.0 で出荷し、LP は WASM を v1.20.0 に同期した。

**実 API は index ベース**だった点に注意（当初提案した semantic 名 `--tdsl-lane-warm/gold/plum/sky` ではない）。WASM 出力 SVG の `<style>` は次の形式:

```css
:root { --tdsl-lane-0: #4682B4; --tdsl-lane-1: #E67E22; ... --tdsl-lane-7: #2980B9; }
.tdsl-event-dot { fill: var(--tdsl-lane-0, #4682B4); }  /* N = lane 出現順 0..7 */
```

LP 側の追従は `global.css` で 2 段に分けて実装している:

1. **semantic トークン**（`:root`）: `--tdsl-lane-warm/gold/plum/sky` が `--color-*` をプロキシし light/dark/HC に追従。
2. **index→semantic ブリッジ**（`.tdsl-root`）: WASM の `--tdsl-lane-0..7` を LP パレットに cycle 適用（0→warm / 1→gold / 2→plum / 3→sky、以降反復）。WASM の inline `:root` より近い祖先で再定義することで継承で確実に上書きする。

回帰ガード: `src/lib/tdsl-lane-bridge.test.ts`（ブリッジの存在と対応関係）/ `src/lib/lane-palette.test.ts`（パレット値）。

### 据え置き期間中のレビュー観点

本体レンダラーのデフォルト配色を変更する PR は、LP 側の `.tdsl-root` ブリッジ（index→semantic）が生きているため表示は LP パレットに追従するが、`var()` の fallback hex（変数未定義環境用）は本体デフォルトに依存する点に注意する。

---

## 9. OGP / Social preview

### フォーマット方針: PNG を正とする（#307）

OGP 画像（`og:image` / `twitter:image`）は **PNG を採用** します。

- **判断根拠**: X (Twitter) / Slack / Facebook / LINE 等の主要プラットフォームは OG 画像の SVG を **サポートしておらず**、共有時にサムネイルが描画されない。共有プレビューはソーシャル流入の入口であり、確実に描画される PNG を正とする。
- **サイズ規約**: すべての OG 画像は **1200 × 630（横長 1.91:1）固定**。`SocialMeta.astro` が出力する `og:image:width` / `og:image:height` はこの固定値に整合する。新規 OG 画像を制作する際もこの寸法を厳守する（規約で固定するため width/height の動的算出は行わない）。
- **MIME の整合**: `SocialMeta.astro` は `imagePath` の拡張子から `og:image:type` を導出して出力する（`.png` → `image/png`、`.svg` → `image/svg+xml` など）。画像実体を差し替えれば `og:image:type` が自動で追従するため、メタと実体が乖離しない。

### スコープの分担

- 本セクションの方針確定と `SocialMeta.astro` のメタ整合（`og:image:type` 出力・width/height 検証）が #307。
- ページ種別別 PNG の制作・`public/og/` への配置・既定 `imagePath` の PNG 切替は #308。
- ページごとの OG 画像切り替えと smoke 検証は #309。

---

## 10. i18n bypass policy（#427）

LP コンポーネントには、辞書（`site/src/i18n/{ja,en}.ts`）を経由せず英語のまま固定表示している文言がある。「意図的なブランド表記」と「辞書化漏れ」を区別するため、**bypass が許される対象をここに明示的に列挙する**。列挙外の可視・SR 露出テキストは辞書化が必須。

### bypass 対象（英語固定でよいもの）

次のいずれかに該当するものだけを bypass 対象とする。

1. **CLI コマンド・出力文字列**: `tdsl check world-history.tdsl`、`0 errors`、`tdsl check source.tdsl` 等。実際の CLI 出力の再現であり翻訳すると実態と乖離する。
2. **ファイル名**: `world-history.tdsl`、`source.tdsl`、`preview.html` 等。ファイル名は翻訳対象ではない。
3. **Feature card の kicker**（`Author` / `Validate` / `Render`）: 3 枚のカードを識別する短いラベルで、DESIGN.md §5 Feature card が定義する固定構成の一部。
4. **`aria-hidden="true"`（`inert` 併用含む）でスクリーンリーダーからも隠されている装飾テキスト**: Hero の `.timeline-preview`（`Rendered timeline` / `980 - 1260` / lane ラベルは除く。lane ラベルは辞書化済み）、`.command-strip`、Feature card の `.feature-figure`（診断メッセージ・コマンド文字列・目盛りを含む）等。可視でも SR でも到達できないため翻訳の実益がない。

### bypass 対象外（辞書化が必須）

次は上記のいずれにも該当せず、可視かつ／または SR 露出があるため辞書化した（本 issue #427 で対応）。

- Workflow セクションの eyebrow（`site/src/components/lp/WorkflowSection.astro`） → `lp.workflow.eyebrow`
- Hero の release-summary ラベル `Latest`（`site/src/components/lp/HeroSection.astro`） → `lp.hero.latest_release_label`
- Hero editor panel の panel-bar 内 `validated`（`aria-hidden` 対象外、SR 露出） → `lp.hero.panel_bar.validated`

新しく可視・SR 露出のハードコード文言を追加する場合は、上記 bypass 対象の 4 分類のいずれかに明確に該当するかを確認し、該当しなければ辞書キーを追加すること。

---

## 11. Files of record

決定の根拠となるファイルは以下です。DESIGN.md と乖離が出た場合、まずはこちらが現行の真実です。発見次第どちらかを更新してください。

- `site/src/styles/global.css` — トークンとレイアウトの一次定義
- `site/src/components/SiteHeader.astro` — LP / Playground / Gallery / Changelog のヘッダーと a11y メニューの実装
- `site/src/components/DocsA11yMenu.astro` — Docs ヘッダーへの a11y メニュー追加（Starlight `SocialIcons` override）
- `site/astro.config.mjs` — Starlight の `components.SocialIcons` 登録を含む設定
- `site/src/components/SocialMeta.astro` — OGP / Twitter Card メタの一次定義（`og:image:type` は拡張子から導出）
- `site/src/pages/index.astro` — ヒーロー / feature / workflow / usecase / install の構造
- `site/src/pages/playground.astro` — Playground の 3 ペイン構造と `?source=` プリロード
- `site/src/pages/gallery.astro` — Gallery ページ（2 ペインカード + クライアントサイド SVG レンダリング）
- `site/src/data/gallery-samples.json` — Gallery サンプルデータ
- `site/src/pages/changelog.astro` — リリース表示のテンプレート
- `site/src/lib/tdsl-wasm.ts` — Playground と Docs から WASM を呼ぶ唯一の経路

---

## Out of scope

このドキュメントは以下を **扱いません**。

- Timeline DSL 本体の DSL 文法・パーサ・WASM の API 設計
- リポジトリのリリースフロー（README.md と `.github/` を参照）
- Cloudflare Pages のデプロイ設定（README.md を参照）
- 個別 PR のスコープ判定（issue / PR で議論）
