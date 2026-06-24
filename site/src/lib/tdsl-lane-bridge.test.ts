// @vitest-environment node
// #303: WASM v1.20.0 が出力する index ベースの --tdsl-lane-0..7 を LP の semantic
// パレット（--tdsl-lane-warm/gold/plum/sky）へ橋渡しする .tdsl-root ブロックの回帰ガード。
//
// このブリッジが欠落すると、Playground / Gallery / TimelineEmbed の SVG の span/event
// 着色が WASM デフォルト hex のまま固定され、LP テーマ（light/dark/HC）に追従しなくなる。
// サイレントなビジュアル回帰になるため CSS テキストで存在と対応関係を assert する。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssText = readFileSync(
  fileURLToPath(new URL("../styles/global.css", import.meta.url)),
  "utf8",
);

// `.tdsl-root {` ブロック（index ブリッジ）を抽出する。複数の `.tdsl-root .foo {`
// セレクタと区別するため、`.tdsl-root {`（直後に空白 + 波括弧）を厳密に探す。
function extractTdslRootBlock(): string {
  const match = cssText.match(/\.tdsl-root\s*\{[^}]*\}/);
  if (!match) throw new Error(".tdsl-root { ... } block not found");
  return match[0];
}

// WASM の 8 スロットへ LP パレットを cycle 適用する期待マッピング（warm/gold/plum/sky）。
const EXPECTED_CYCLE = ["warm", "gold", "plum", "sky"] as const;

describe("tdsl-lane index→semantic bridge (#303)", () => {
  const block = extractTdslRootBlock();

  for (let i = 0; i < 8; i++) {
    const semantic = EXPECTED_CYCLE[i % EXPECTED_CYCLE.length];
    it(`--tdsl-lane-${i} が var(--tdsl-lane-${semantic}) にマップされる`, () => {
      const re = new RegExp(`--tdsl-lane-${i}:\\s*var\\(--tdsl-lane-${semantic}\\)`);
      expect(block).toMatch(re);
    });
  }

  it("semantic トークン --tdsl-lane-warm/gold/plum/sky が :root で --color-* をプロキシする", () => {
    for (const name of EXPECTED_CYCLE) {
      const re = new RegExp(`--tdsl-lane-${name}:\\s*var\\(--color-${name}\\)`);
      expect(cssText).toMatch(re);
    }
  });
});
