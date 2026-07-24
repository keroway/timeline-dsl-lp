import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

import { en } from "../i18n/en";
import { LANE_HEX_LIGHT as LANE_HEX, type LaneColor } from "./lane-palette";

/**
 * ページ種別ごとの OG 画像（1200×630 PNG）をビルド時に生成する。
 *
 * 手書き SVG を @resvg/resvg-js でラスタライズする。フォントは Inter（OFL）を
 * バンドルして渡すため、システムフォントに依存せず CI / ローカルで決定的に描画される。
 * デザインは従来の共有 OG（ダークグラデ背景＋クリームカード＋td バッジ＋ワードマーク＋
 * lane ドットのタイムライン線）を踏襲し、ページ種別の eyebrow とアクセント lane 色で
 * 差し替える。DESIGN.md §9（PNG / 1200×630 固定）準拠。
 *
 * テキストは英語固定（Inter に日本語グリフが無いため）。OG 画像はページ種別単位で
 * ja / en 共通の 1 枚を参照する（#308 / #309 の受け入れ条件で「同じ画像」を許容）。
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgCardSpec {
  /** ページ種別の eyebrow（大文字）。default は eyebrow 無し */
  eyebrow?: string;
  /** カードのサブタイトル（英語） */
  subtitle: string;
  /** アクセントに使う lane 色 */
  accent: LaneColor;
}

/**
 * OG 画像のページ種別定義。キーが `/og/<key>.png` のルートになる。
 * `default` は SocialMeta の既定 imagePath（種別を渡さないページの fallback）で、
 * LP と完全同一の見た目になるので `lp` の alias として同じオブジェクトを共有する。
 */
const LP_CARD: OgCardSpec = {
  subtitle: en["og.lp.subtitle"],
  accent: "warm",
};

export const OG_CARDS = {
  default: LP_CARD,
  lp: LP_CARD,
  playground: {
    eyebrow: en["og.playground.eyebrow"],
    subtitle: en["og.playground.subtitle"],
    accent: "sky",
  },
  gallery: {
    eyebrow: en["og.gallery.eyebrow"],
    subtitle: en["og.gallery.subtitle"],
    accent: "plum",
  },
  changelog: {
    eyebrow: en["og.changelog.eyebrow"],
    subtitle: en["og.changelog.subtitle"],
    accent: "gold",
  },
} satisfies Record<string, OgCardSpec>;

export type OgCardKey = keyof typeof OG_CARDS;

// フォントはビルド時に Node から読むため、バンドル後も安定する project root（site/）基準の
// 絶対パスで解決する（import.meta.url はバンドル後 dist を指し src/assets を解決できない）。
const FONTS_DIR = join(process.cwd(), "src/assets/fonts");
const FONT_SEMIBOLD = join(FONTS_DIR, "Inter-SemiBold.otf");
const FONT_REGULAR = join(FONTS_DIR, "Inter-Regular.otf");

/** XML テキストエスケープ（テキストは内部固定値だが念のため） */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** ページ種別の SVG を組み立てる */
export function buildOgSvg(spec: OgCardSpec): string {
  const accentHex = LANE_HEX[spec.accent];
  const hasEyebrow = Boolean(spec.eyebrow);
  // eyebrow がある種別はワードマークを少し下げてバランスを取る
  const wordmarkY = hasEyebrow ? 392 : 364;
  const subtitleY = hasEyebrow ? 452 : 424;

  const eyebrowMarkup = hasEyebrow
    ? `<text x="130" y="320" fill="${accentHex}" font-family="Inter" font-size="30" font-weight="600" letter-spacing="6">${escapeXml(
        spec.eyebrow!.toUpperCase()
      )}</text>`
    : "";

  // タイムライン線上の lane ドット。先頭ドットを種別アクセント色にして種別差を出す
  const dots = [
    { cx: 250, color: accentHex },
    { cx: 538, color: LANE_HEX.sky },
    { cx: 826, color: LANE_HEX.plum },
  ]
    .map((d) => `<circle cx="${d.cx}" cy="500" r="16" fill="${d.color}" />`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#101820" />
      <stop offset="0.55" stop-color="#182c3a" />
      <stop offset="1" stop-color="#2c3e34" />
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)" />
  <rect x="80" y="76" width="1040" height="478" rx="28" fill="#f7f3ea" />
  <rect x="130" y="128" width="132" height="132" rx="24" fill="#26333b" />
  <text x="196" y="214" text-anchor="middle" fill="#f7f3ea" font-family="Inter" font-size="56" font-weight="600">td</text>
  ${eyebrowMarkup}
  <text x="128" y="${wordmarkY}" fill="#26333b" font-family="Inter" font-size="78" font-weight="600">Timeline DSL</text>
  <text x="130" y="${subtitleY}" fill="#50636f" font-family="Inter" font-size="32" font-weight="400">${escapeXml(
    spec.subtitle
  )}</text>
  <line x1="132" y1="500" x2="1032" y2="500" stroke="#d6c27b" stroke-width="8" stroke-linecap="round" />
  ${dots}
</svg>`;
}

/** ページ種別の OG 画像を PNG バッファとして生成する */
export function renderOgPng(spec: OgCardSpec): Buffer {
  const svg = buildOgSvg(spec);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: {
      fontFiles: [FONT_SEMIBOLD, FONT_REGULAR],
      defaultFontFamily: "Inter",
      loadSystemFonts: false,
    },
  });
  return resvg.render().asPng();
}
