// @vitest-environment node
// jsdom の Blob は .stream() / CompressionStream 連携を持たないため、
// Web Streams を native 実装する node 環境で実行する。
import { describe, expect, it } from "vitest";
import {
  buildShareUrl,
  decodeShareSource,
  encodeShareSource,
  extractSourceFromLocation,
  MAX_DECODED_SOURCE_BYTES,
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
      expect(
        result.url.startsWith(
          "https://timeline-dsl-lp.pages.dev/playground/?src="
        )
      ).toBe(true);
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
  it("src クエリを復号して status=ok で返す", async () => {
    const encoded = await encodeShareSource("event x");
    expect(await extractSourceFromLocation(`?src=${encoded}`)).toEqual({
      status: "ok",
      source: "event x",
    });
  });

  it("legacy の source クエリは status=ok でそのまま返す", async () => {
    expect(await extractSourceFromLocation("?source=event%20legacy")).toEqual({
      status: "ok",
      source: "event legacy",
    });
  });

  it("復号できない src は status=invalid を返す", async () => {
    expect(await extractSourceFromLocation("?src=@@@not-valid@@@")).toEqual({
      status: "invalid",
    });
  });

  it("クエリが無ければ status=none を返す", async () => {
    expect(await extractSourceFromLocation("")).toEqual({ status: "none" });
  });

  it("高圧縮率データが展開後上限を超える場合は status=invalid を返す（zip bomb 対策）", async () => {
    // 高圧縮率な繰り返し文字列: URL 長は短いが展開後は上限を大きく超える。
    const source = "a".repeat(MAX_DECODED_SOURCE_BYTES + 50_000);
    const encoded = await encodeShareSource(source);
    expect(encoded.length).toBeLessThan(MAX_SHARE_URL_LENGTH);
    expect(await extractSourceFromLocation(`?src=${encoded}`)).toEqual({
      status: "invalid",
    });
  });

  it("展開後サイズが上限ちょうど以下なら status=ok を返す", async () => {
    const source = "b".repeat(MAX_DECODED_SOURCE_BYTES - 10);
    const encoded = await encodeShareSource(source);
    expect(await extractSourceFromLocation(`?src=${encoded}`)).toEqual({
      status: "ok",
      source,
    });
  });

  it("legacy source クエリが URL 長上限を超える場合は status=invalid を返す", async () => {
    const legacy = "a".repeat(MAX_SHARE_URL_LENGTH + 1);
    expect(await extractSourceFromLocation(`?source=${legacy}`)).toEqual({
      status: "invalid",
    });
  });
});

describe("decodeShareSource", () => {
  it("展開後サイズが上限を超えると reject する", async () => {
    const source = "c".repeat(MAX_DECODED_SOURCE_BYTES + 50_000);
    const encoded = await encodeShareSource(source);
    await expect(decodeShareSource(encoded)).rejects.toThrow();
  });
});
