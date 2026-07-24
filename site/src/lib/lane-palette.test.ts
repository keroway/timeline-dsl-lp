// @vitest-environment node
// tokens.css の lane 色 4 ブロック (light / lightHc / dark / darkHc) と
// LANE_PALETTE が一致することを assert する。CSS とコードのドリフトを検知する。
// (トークンは global.css から tokens.css へ移設済み)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { LANE_PALETTE, type LaneColor, type LaneTheme } from "./lane-palette";

const cssText = readFileSync(
  fileURLToPath(new URL("../styles/tokens.css", import.meta.url)),
  "utf8"
);

const LANE_VARS: LaneColor[] = ["warm", "gold", "plum", "sky"];

// global.css の 4 ブロックを開始マーカー / 終了マーカーで抽出する。
// マーカーは将来の編集にも追従しやすい固定パターン:
//   light       : ファイル先頭 ":root {" から最初の "}"
//   lightHc     : ':root[data-a11y-contrast="high"] {' から最初の "}"
//   dark        : '@media (prefers-color-scheme: dark)' 内の最初の ":root {" から閉じ "}"
//   darkHc      : 同 media query 内の ':root[data-a11y-contrast="high"] {' から閉じ "}"
function extractBlock(start: string, source = cssText): string {
  const at = source.indexOf(start);
  if (at < 0) throw new Error(`block start not found: ${start}`);
  const end = source.indexOf("}", at);
  if (end < 0) throw new Error(`block end not found: ${start}`);
  return source.slice(at, end);
}

function readHex(block: string, name: LaneColor): string {
  const match = block.match(
    new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`)
  );
  if (!match) throw new Error(`--color-${name} not found in block`);
  return match[1].toLowerCase();
}

const darkMedia = (() => {
  const at = cssText.indexOf("@media (prefers-color-scheme: dark)");
  if (at < 0) throw new Error("dark media query not found");
  return cssText.slice(at);
})();

const blocks: Record<LaneTheme, string> = {
  light: extractBlock(":root {"),
  lightHc: extractBlock(':root[data-a11y-contrast="high"] {'),
  dark: extractBlock(":root {", darkMedia),
  darkHc: extractBlock(':root[data-a11y-contrast="high"] {', darkMedia),
};

describe("LANE_PALETTE", () => {
  for (const theme of Object.keys(blocks) as LaneTheme[]) {
    describe(theme, () => {
      for (const name of LANE_VARS) {
        it(`--color-${name} が LANE_PALETTE.${theme}.${name} と一致する`, () => {
          expect(readHex(blocks[theme], name)).toBe(
            LANE_PALETTE[theme][name].toLowerCase()
          );
        });
      }
    });
  }
});
