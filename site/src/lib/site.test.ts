// @vitest-environment node
// site.ts はブラウザ API に依存しない純粋関数群なので node 環境で検証する。
import { describe, expect, it } from "vitest";
import { formatDate, getSiteUrl, PRODUCTION_ORIGIN } from "./site";

describe("getSiteUrl", () => {
  it("Astro.site があればそれをそのまま返す", () => {
    const site = new URL("https://example.test/");
    expect(getSiteUrl({ site })).toBe(site);
  });

  it("Astro.site が undefined なら本番 origin を返す", () => {
    expect(getSiteUrl({ site: undefined }).toString()).toBe(
      new URL(PRODUCTION_ORIGIN).toString()
    );
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

  it("日付境界は UTC 基準で固定される（実行環境の TZ に依存しない）", () => {
    // 2026-07-18T17:19:54Z は Asia/Tokyo では 7/19 になる境界
    expect(formatDate("2026-07-18T17:19:54Z", "ja")).toBe("2026年7月18日");
    expect(formatDate("2026-07-18T17:19:54Z", "en")).toBe("July 18, 2026");
    // 2026-08-14T01:55:22Z は America/Los_Angeles では 8/13 になる境界
    expect(formatDate("2026-08-14T01:55:22Z", "en")).toBe("August 14, 2026");
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
