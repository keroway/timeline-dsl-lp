// @vitest-environment node
// global.css の明示的テーマ切替ブロック（:root[data-theme="light|dark"]、#431）が、
// 対応する既存ブロック（base :root / light HC / dark media / dark HC）と
// 同一の色トークン値を持つことを検証する。手動 duplicate の drift を検知する。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssText = readFileSync(
  fileURLToPath(new URL("../styles/global.css", import.meta.url)),
  "utf8",
);

const THEME_VARS = [
  "--color-bg",
  "--color-ink",
  "--color-muted",
  "--color-line",
  "--color-panel",
  "--color-accent",
  "--color-accent-strong",
  "--color-on-accent",
  "--color-warm",
  "--color-gold",
  "--color-plum",
  "--color-sky",
  "--color-status-warn",
  "--color-status-error",
];

function extractBlock(start: string, source = cssText): string {
  const at = source.indexOf(start);
  if (at < 0) throw new Error(`block start not found: ${start}`);
  const end = source.indexOf("}", at);
  if (end < 0) throw new Error(`block end not found: ${start}`);
  return source.slice(at, end);
}

function readValues(block: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const name of THEME_VARS) {
    const match = block.match(new RegExp(`${name.replace(/[-]/g, "\\-")}:\\s*([^;]+);`));
    if (match) values[name] = match[1].trim();
  }
  return values;
}

const darkMedia = (() => {
  const at = cssText.indexOf("@media (prefers-color-scheme: dark)");
  if (at < 0) throw new Error("dark media query not found");
  return cssText.slice(at);
})();

describe(":root[data-theme] の色トークンが既存ブロックと一致する（#431 drift guard）", () => {
  it('[data-theme="light"] は base :root（ライト）と同じ値を持つ', () => {
    const base = readValues(extractBlock(":root {"));
    const forced = readValues(extractBlock(':root[data-theme="light"] {'));
    expect(forced).toEqual(base);
  });

  it('[data-theme="dark"] は @media (prefers-color-scheme: dark) :root と同じ値を持つ', () => {
    const mediaDark = readValues(extractBlock(":root {", darkMedia));
    const forced = readValues(extractBlock(':root[data-theme="dark"] {'));
    expect(forced).toEqual(mediaDark);
  });

  it('[data-theme="light"][data-a11y-contrast="high"] は light HC ブロックと同じ値を持つ', () => {
    const lightHc = readValues(extractBlock(':root[data-a11y-contrast="high"] {'));
    const forced = readValues(
      extractBlock(':root[data-theme="light"][data-a11y-contrast="high"] {'),
    );
    expect(forced).toEqual(lightHc);
  });

  it('[data-theme="dark"][data-a11y-contrast="high"] は dark HC ブロックと同じ値を持つ', () => {
    const darkHc = readValues(extractBlock(':root[data-a11y-contrast="high"] {', darkMedia));
    const forced = readValues(
      extractBlock(':root[data-theme="dark"][data-a11y-contrast="high"] {'),
    );
    expect(forced).toEqual(darkHc);
  });
});
