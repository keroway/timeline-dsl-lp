import { describe, expect, it } from "vitest";
import rawReleasesData from "./releases.generated.json";
import { parseReleasesPayload } from "./releases";

describe("parseReleasesPayload", () => {
  it("現在コミットされている releases.generated.json を検証できる", () => {
    expect(() => parseReleasesPayload(rawReleasesData)).not.toThrow();
  });

  it("schema に適合しない payload では throw する（空データへの fallback をしない）", () => {
    const invalid = { repository: "keroway/timeline-dsl", source: "github" };
    expect(() => parseReleasesPayload(invalid)).toThrow(/failed schema validation/);
  });

  it("release 配列の要素が不正な場合も throw する", () => {
    const invalid = {
      repository: "keroway/timeline-dsl",
      source: "github",
      fetchedAt: null,
      latest: null,
      releases: [{ tagName: "", name: "v1", publishedAt: "2026-01-01", url: "https://example.com", body: "" }],
    };
    expect(() => parseReleasesPayload(invalid)).toThrow(/failed schema validation/);
  });
});
