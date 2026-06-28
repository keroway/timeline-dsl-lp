// @vitest-environment node
// jsdom の Blob は .stream() / CompressionStream 連携を持たないため、
// Web Streams を native 実装する node 環境で実行する。
import { describe, expect, it } from "vitest";
import {
  buildShareUrl,
  decodeShareSource,
  encodeShareSource,
  extractSourceFromLocation,
  MAX_SHARE_URL_LENGTH,
} from "./playground-share";

// gzip で縮みにくい高エントロピー文字列を生成する（too_long 分岐の検証用）。
// 周期的なパターンは gzip に圧縮されてしまうため、xorshift32 PRNG を使う。
function highEntropy(length: number): string {
  let state = 0x12345678;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    out += String.fromCharCode(33 + (state % 94));
  }
  return out;
}

describe("encode/decode round-trip", () => {
  it("encodeShareSource → decodeShareSource で元のソースに戻る", async () => {
    const source = "event 織田信長 1534\nimport wikidata Q1";
    const encoded = await encodeShareSource(source);
    expect(await decodeShareSource(encoded)).toBe(source);
  });
});

describe("buildShareUrl", () => {
  it("短いソースは ok=true で src クエリ付き URL を返す", async () => {
    const result = await buildShareUrl({
      source: "event x",
      origin: "https://timeline-dsl-lp.pages.dev",
      pathname: "/playground/",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url.startsWith("https://timeline-dsl-lp.pages.dev/playground/?src=")).toBe(
        true,
      );
    }
  });

  it("URL 長が上限を超えると ok=false / too_long を返す", async () => {
    const result = await buildShareUrl({
      source: highEntropy(20000),
      origin: "https://timeline-dsl-lp.pages.dev",
      pathname: "/playground/",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("too_long");
      expect(result.length).toBeGreaterThan(MAX_SHARE_URL_LENGTH);
    }
  });
});

describe("extractSourceFromLocation", () => {
  it("src クエリを復号して返す", async () => {
    const encoded = await encodeShareSource("event x");
    expect(await extractSourceFromLocation(`?src=${encoded}`)).toBe("event x");
  });

  it("legacy の source クエリはそのまま返す", async () => {
    expect(await extractSourceFromLocation("?source=event%20legacy")).toBe("event legacy");
  });

  it("復号できない src は null を返す", async () => {
    expect(await extractSourceFromLocation("?src=@@@not-valid@@@")).toBeNull();
  });

  it("クエリが無ければ null を返す", async () => {
    expect(await extractSourceFromLocation("")).toBeNull();
  });
});
