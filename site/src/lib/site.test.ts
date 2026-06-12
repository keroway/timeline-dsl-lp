// @vitest-environment node
// site.ts はブラウザ API に依存しない純粋関数群なので node 環境で検証する。
import { describe, expect, it } from "vitest";
import { PRODUCTION_ORIGIN, getSiteUrl, formatDate } from "./site";

describe("getSiteUrl", () => {
  it("Astro.site があればそれをそのまま返す", () => {
    const site = new URL("https://example.test/");
    expect(getSiteUrl({ site })).toBe(site);
  });

  it("Astro.site が undefined なら本番 origin を返す", () => {
    expect(getSiteUrl({ site: undefined }).toString()).toBe(new URL(PRODUCTION_ORIGIN).toString());
  });
});

describe("formatDate", () => {
  it("ja ロケールで ja-JP 整形する", () => {
    const expected = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date("2026-06-12"));
    expect(formatDate("2026-06-12", "ja")).toBe(expected);
  });

  it("en ロケールで en-US 整形する", () => {
    const expected = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date("2026-06-12"));
    expect(formatDate("2026-06-12", "en")).toBe(expected);
  });

  it("空値は null を返す", () => {
    expect(formatDate(null, "ja")).toBeNull();
    expect(formatDate(undefined, "ja")).toBeNull();
    expect(formatDate("", "en")).toBeNull();
  });

  it("不正な日付は null を返す", () => {
    expect(formatDate("not-a-date", "en")).toBeNull();
  });
});
