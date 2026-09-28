import { describe, expect, it } from "vitest";
import {
  renderSvgFromSource,
  renderSvgFromSourceWithOptions,
} from "./tdsl-wasm-node.mts";

const sample = `timeline "Sample" {
    title "Sample";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

lane "Project" as project { kind custom; order 10; }

event project 2026 "Kickoff" { id "event:kickoff"; };
`;

describe("renderSvgFromSource", () => {
  it("SVG を返す", async () => {
    const svg = await renderSvgFromSource(sample);
    expect(svg).toContain("<svg");
    expect(svg).toContain("Kickoff");
  });
});

describe("renderSvgFromSourceWithOptions", () => {
  it("options 省略時は locale=en の aria-label prefix になる（既定値）", async () => {
    const svg = await renderSvgFromSourceWithOptions(sample);
    expect(svg).toContain('aria-label="Event:');
  });

  it('locale: "ja" を渡すと日本語の aria-label prefix になる', async () => {
    const svg = await renderSvgFromSourceWithOptions(sample, 0, {
      locale: "ja",
    });
    expect(svg).toContain("Kickoff");
    expect(svg).not.toContain('aria-label="Event:');
  });

  it("grid を渡してもエラーにならず SVG を返す", async () => {
    const svg = await renderSvgFromSourceWithOptions(sample, 0, {
      grid: "year",
    });
    expect(svg).toContain("<svg");
  });

  it("連続呼び出しでも opts の二重解放エラーにならない（__destroy_into_raw 消費の回帰）", async () => {
    await expect(
      renderSvgFromSourceWithOptions(sample, 0, { locale: "en" })
    ).resolves.toContain("<svg");
    await expect(
      renderSvgFromSourceWithOptions(sample, 0, { locale: "ja" })
    ).resolves.toContain("<svg");
  });
});
