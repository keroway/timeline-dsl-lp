// @vitest-environment node
// #560: `site/src/lib/tdsl.tmLanguage.json` が本体の single source of truth
// `apps/webui/src/lang-tdsl/keywords.json`（`site/src/lib/tdsl-keywords.json` に
// vendoring 済み）からドリフトすると、Playground / docs コードブロックで一部の
// キーワードが無着色のまま黙って劣化する。ここでは keywords.json の全キーワードが
// tmLanguage のいずれかの `match` パターンでカバーされていることを assert する。
//
// vendored コピーの更新は WASM 同様に本体リポジトリ側からの手動同期が必要
// （CI からは ../timeline-dsl に届かないため、コピーとの一致のみを検証する）。
import { describe, expect, it } from "vitest";
import tmLanguage from "./tdsl.tmLanguage.json" with { type: "json" };
import keywords from "./tdsl-keywords.json" with { type: "json" };

type TmNode = {
  match?: string;
  begin?: string;
  end?: string;
  patterns?: TmNode[];
};

function collectMatchPatterns(node: unknown, acc: RegExp[] = []): RegExp[] {
  if (node && typeof node === "object") {
    const typed = node as TmNode;
    if (typeof typed.match === "string") {
      acc.push(new RegExp(typed.match));
    }
    for (const value of Object.values(node)) {
      collectMatchPatterns(value, acc);
    }
  }
  return acc;
}

const patterns = collectMatchPatterns(tmLanguage.repository);
const allKeywords = [
  ...keywords.BLOCK_KEYWORDS,
  ...keywords.ITEM_KEYWORDS,
  ...keywords.MISC_KEYWORDS,
];

describe("tdsl.tmLanguage keyword coverage (#560)", () => {
  for (const word of allKeywords) {
    it(`\`${word}\` が tmLanguage のいずれかのパターンにマッチする`, () => {
      const covered = patterns.some((re) => re.test(word));
      expect(covered).toBe(true);
    });
  }

  it("vendored tdsl-keywords.json のキーワード数が53語である", () => {
    expect(allKeywords.length).toBe(53);
  });
});

describe("日時リテラルの構文カバレッジ (#560)", () => {
  const datetimeLiteral = new RegExp(
    (tmLanguage.repository as Record<string, TmNode>)["datetime-literal"]
      .match as string
  );
  const datetimeRange = new RegExp(
    (tmLanguage.repository as Record<string, TmNode>)["datetime-range"]
      .match as string
  );

  it.each([
    "1969",
    "-206",
    "1969-07",
    "1969-07-20",
    "1969-07-20T20:17",
    "1969-07-20T20:17:40",
    "1969-07-20T20:17:40Z",
    "1969-07-20T20:17:40+09:00",
    "-0206-01-15",
  ])("単一の日時リテラル `%s` にマッチする", (literal) => {
    expect(datetimeLiteral.test(literal)).toBe(true);
  });

  it.each([
    "2025..2027",
    "-300..300",
    "1900..1969-07-20",
    "1969-07-20T00:00..1969-07-21T06:00",
    "1969-07-20T20:17:00..1969-07-20T20:18:00",
  ])("日時範囲 `%s` にマッチする", (range) => {
    expect(datetimeRange.test(range)).toBe(true);
  });
});

describe("wd:Q参照とブロックコメントの構文カバレッジ (#560)", () => {
  const wikidataRef = new RegExp(
    (tmLanguage.repository as Record<string, TmNode>)["wikidata-ref"]
      .match as string
  );

  it("`wd:Q95` にマッチする", () => {
    expect(wikidataRef.test("wd:Q95")).toBe(true);
  });

  it("`wd:P571` にマッチする", () => {
    expect(wikidataRef.test("wd:P571")).toBe(true);
  });

  it("comments リポジトリにブロックコメントの begin/end が存在する", () => {
    const commentPatterns = (tmLanguage.repository as Record<string, TmNode>)
      .comments.patterns as TmNode[];
    const blockComment = commentPatterns.find(
      (p) => p.begin === "/\\*" && p.end === "\\*/"
    );
    expect(blockComment).toBeDefined();
  });
});
