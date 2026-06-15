/**
 * lane 色の single source。CSS 変数（global.css）と Node 側ビルド時描画
 * （og-image.ts）が共通参照する。値は light / lightHc / dark / darkHc の 4 テーマ分。
 *
 * テーマ別 hex は DESIGN.md §2 と global.css の WCAG コントラスト設計に従う。
 * global.css 側の値と一致することは lane-palette.test.ts で常時検証する。
 */

export type LaneColor = "warm" | "gold" | "plum" | "sky";

export type LaneTheme = "light" | "lightHc" | "dark" | "darkHc";

export const LANE_PALETTE: Record<LaneTheme, Record<LaneColor, string>> = {
  light: {
    warm: "#a74718",
    gold: "#d69a24",
    plum: "#7b4569",
    sky: "#2c6f9f",
  },
  lightHc: {
    warm: "#800000",
    gold: "#806000",
    plum: "#600060",
    sky: "#00557a",
  },
  dark: {
    warm: "#b8501c",
    gold: "#9a6a12",
    plum: "#915581",
    sky: "#2f7bb0",
  },
  darkHc: {
    warm: "#c0461a",
    gold: "#8f6410",
    plum: "#8a4f76",
    sky: "#2f78ac",
  },
};

/** og-image など Node 側ビルド時描画で参照する light（既定）パレット */
export const LANE_HEX_LIGHT = LANE_PALETTE.light;
