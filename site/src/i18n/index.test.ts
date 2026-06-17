import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  en,
  getLocaleFromUrl,
  isLocale,
  ja,
  resolveLocale,
  resolveLocaleFromLocation,
} from "./index";

function collectKeyPaths(obj: Record<string, unknown>, prefix: string, out: Set<string>): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      collectKeyPaths(value as Record<string, unknown>, path, out);
    } else {
      out.add(path);
    }
  }
}

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

describe("dictionary parity", () => {
  it("ja.ts と en.ts が同一キーセットを持つ", () => {
    const jaKeys = new Set<string>();
    const enKeys = new Set<string>();
    collectKeyPaths(ja, "", jaKeys);
    collectKeyPaths(en, "", enKeys);

    const missingInEn = [...jaKeys].filter((key) => !enKeys.has(key)).sort();
    const missingInJa = [...enKeys].filter((key) => !jaKeys.has(key)).sort();

    expect(missingInEn, `ja.ts にあって en.ts にないキー: ${missingInEn.join(", ")}`).toEqual([]);
    expect(missingInJa, `en.ts にあって ja.ts にないキー: ${missingInJa.join(", ")}`).toEqual([]);
  });
});
