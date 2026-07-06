import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { INSTALL_CHANNELS } from "./install-channels";

// Docs（installation.mdx / homebrew.mdx）のコマンド文言と LP タブが同一ソースを指すことを
// 保証するドリフト検知テスト（#430 受け入れ基準「コマンド文言が docs と単一ソースで同期している」）。
// Starlight の MDX コンテンツから直接 install-channels.ts を import すると Docs 側の
// コードブロック表示（Expressive Code）を Astro コンポーネントへ置き換える大掛かりな変更が
// 必要になるため、ここでは docs 本文が INSTALL_CHANNELS の各コマンド行をそのまま含むことを
// テストで固定し、どちらかだけを変更した場合にこのテストが失敗してドリフトを検知する。
const DOCS_FILES = [
  "../content/docs/docs/homebrew.mdx",
  "../content/docs/en/docs/homebrew.mdx",
];

function readDocsFile(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

describe("install-channels docs 単一ソース同期", () => {
  const docsContents = DOCS_FILES.map(readDocsFile);

  for (const channel of INSTALL_CHANNELS) {
    it(`${channel.id} の各コマンド行が homebrew.mdx（ja / en）に含まれる`, () => {
      for (const line of channel.lines) {
        const foundInAny = docsContents.some((content) => content.includes(line));
        expect(foundInAny, `command line not found in docs: ${line}`).toBe(true);
      }
    });
  }
});
