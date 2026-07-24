import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  getPreferredColorScheme,
  initThemeToggle,
  loadTheme,
  parseTheme,
  resolveAppliedTheme,
  storeTheme,
} from "./theme";

const STORAGE_KEY = "starlight-theme";

function stubMatchMedia(prefersLight: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query.includes("light") ? prefersLight : !prefersLight,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseTheme", () => {
  it("light / dark / auto はそのまま返す", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("auto")).toBe("auto");
  });

  it("不明な値・空文字・null は auto にフォールバックする（Starlight と同一挙動）", () => {
    expect(parseTheme("")).toBe("auto");
    expect(parseTheme(null)).toBe("auto");
    expect(parseTheme("solarized")).toBe("auto");
  });
});

describe("loadTheme / storeTheme", () => {
  it("Starlight と同じ localStorage キー（starlight-theme）を読み書きする", () => {
    storeTheme("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(loadTheme()).toBe("dark");
  });

  it("auto を保存すると空文字列になる（Starlight の storeTheme と同一）", () => {
    storeTheme("auto");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("");
    expect(loadTheme()).toBe("auto");
  });
});

describe("resolveAppliedTheme / applyTheme", () => {
  it("auto は OS の prefers-color-scheme に解決される", () => {
    stubMatchMedia(true);
    expect(resolveAppliedTheme("auto")).toBe("light");
    stubMatchMedia(false);
    expect(resolveAppliedTheme("auto")).toBe("dark");
  });

  it("light / dark は OS 設定に関わらずそのまま適用される", () => {
    stubMatchMedia(false);
    expect(resolveAppliedTheme("light")).toBe("light");
    stubMatchMedia(true);
    expect(resolveAppliedTheme("dark")).toBe("dark");
  });

  it("applyTheme は <html> の data-theme 属性を更新する", () => {
    stubMatchMedia(true);
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("auto");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("getPreferredColorScheme", () => {
  it("prefers-color-scheme: light にマッチするとき light を返す", () => {
    stubMatchMedia(true);
    expect(getPreferredColorScheme()).toBe("light");
  });

  it("マッチしないとき dark を返す", () => {
    stubMatchMedia(false);
    expect(getPreferredColorScheme()).toBe("dark");
  });
});

describe("initThemeToggle", () => {
  function mountSelect(): HTMLSelectElement {
    document.body.innerHTML = `
      <select data-theme-select>
        <option value="auto">auto</option>
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>`;
    return document.querySelector("[data-theme-select]") as HTMLSelectElement;
  }

  it("初期化時に保存済みテーマを select の値へ反映する", () => {
    stubMatchMedia(true);
    storeTheme("dark");
    const select = mountSelect();

    initThemeToggle({ selectSelector: "[data-theme-select]" });

    expect(select.value).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("select の change で data-theme と localStorage の両方を更新する", () => {
    stubMatchMedia(false);
    const select = mountSelect();
    initThemeToggle({ selectSelector: "[data-theme-select]" });

    select.value = "light";
    select.dispatchEvent(new Event("change"));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("複数の select（desktop / mobile 相当）を同時に同期する", () => {
    stubMatchMedia(true);
    document.body.innerHTML = `
      <select data-theme-select><option value="auto">a</option><option value="light">l</option><option value="dark">d</option></select>
      <select data-theme-select><option value="auto">a</option><option value="light">l</option><option value="dark">d</option></select>`;
    const [first, second] = Array.from(
      document.querySelectorAll<HTMLSelectElement>("[data-theme-select]")
    );
    initThemeToggle({ selectSelector: "[data-theme-select]" });

    first.value = "dark";
    first.dispatchEvent(new Event("change"));

    expect(second.value).toBe("dark");
  });

  it("select が存在しないマークアップでは何もしない", () => {
    document.body.innerHTML = "";
    expect(() =>
      initThemeToggle({ selectSelector: "[data-theme-select]" })
    ).not.toThrow();
  });
});
