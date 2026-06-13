import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getLocaleFromUrl,
  isLocale,
  resolveLocale,
  resolveLocaleFromLocation,
} from "./index";

describe("DEFAULT_LOCALE", () => {
  it("ja を採用している", () => {
    expect(DEFAULT_LOCALE).toBe("ja");
  });
});

describe("isLocale", () => {
  it("ja / en を Locale と判定する", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("未対応・undefined・非文字列を弾く", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(123)).toBe(false);
  });
});

describe("getLocaleFromUrl", () => {
  it("/en/... は en", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/en/docs/intro"))).toBe("en");
  });

  it("/ja/... は ja", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/ja/"))).toBe("ja");
  });

  it("プレフィックス無しは DEFAULT_LOCALE", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/docs/intro"))).toBe(DEFAULT_LOCALE);
    expect(getLocaleFromUrl(new URL("https://example.com/"))).toBe(DEFAULT_LOCALE);
  });

  it("未対応ロケールプレフィックスは DEFAULT_LOCALE", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/fr/"))).toBe(DEFAULT_LOCALE);
  });
});

describe("resolveLocale", () => {
  it("Astro.currentLocale が ja/en ならそのまま返す", () => {
    expect(resolveLocale({ currentLocale: "ja" })).toBe("ja");
    expect(resolveLocale({ currentLocale: "en" })).toBe("en");
  });

  it("currentLocale が undefined のとき DEFAULT_LOCALE にフォールバック", () => {
    expect(resolveLocale({ currentLocale: undefined })).toBe(DEFAULT_LOCALE);
    expect(resolveLocale({})).toBe(DEFAULT_LOCALE);
  });

  it("未対応ロケール値は DEFAULT_LOCALE にフォールバック", () => {
    expect(resolveLocale({ currentLocale: "fr" })).toBe(DEFAULT_LOCALE);
  });
});

describe("resolveLocaleFromLocation", () => {
  it("href から locale を解決する", () => {
    expect(resolveLocaleFromLocation({ href: "https://example.com/en/docs/" })).toBe("en");
    expect(resolveLocaleFromLocation({ href: "https://example.com/" })).toBe(DEFAULT_LOCALE);
  });

  it("引数省略時は window.location を参照する", () => {
    // jsdom の既定 href は about:blank なのでプレフィックス無し扱い = DEFAULT_LOCALE
    expect(resolveLocaleFromLocation()).toBe(DEFAULT_LOCALE);
  });
});
