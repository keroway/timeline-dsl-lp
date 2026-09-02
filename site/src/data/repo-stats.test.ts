import { describe, expect, it } from "vitest";
import rawRepoStatsData from "./repo-stats.generated.json";
import { parseRepoStatsPayload } from "./repo-stats";

describe("parseRepoStatsPayload", () => {
  it("現在コミットされている repo-stats.generated.json を検証できる", () => {
    expect(() => parseRepoStatsPayload(rawRepoStatsData)).not.toThrow();
  });

  it("schema に適合しない payload では throw する（空データへの fallback をしない）", () => {
    const invalid = { repository: "keroway/timeline-dsl", source: "github" };
    expect(() => parseRepoStatsPayload(invalid)).toThrow(/failed schema validation/);
  });

  it("数値フィールドの型が不正な場合も throw する", () => {
    const invalid = {
      repository: "keroway/timeline-dsl",
      source: "github",
      fetchedAt: null,
      stargazersCount: "not-a-number",
      licenseSpdxId: null,
      contributorsCount: null,
    };
    expect(() => parseRepoStatsPayload(invalid)).toThrow(/failed schema validation/);
  });
});
