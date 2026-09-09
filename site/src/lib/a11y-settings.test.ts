import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type A11ySettings,
  applySettings,
  initA11yMenu,
  loadSettings,
  SETTINGS_KEY,
  saveSettings,
} from "./a11y-settings";

// jsdom は matchMedia を実装しないので、prefers-* クエリごとの結果を差し込めるよう stub する。
function stubMatchMedia(matches: Record<string, boolean>) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: matches[query] ?? false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
}

const REDUCE = "(prefers-reduced-motion: reduce)";
const CONTRAST = "(prefers-contrast: more)";

beforeEach(() => {
  localStorage.clear();
  stubMatchMedia({});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadSettings", () => {
  it("保存値が無いとき OS 設定（matchMedia）を既定値にする", () => {
    stubMatchMedia({ [REDUCE]: true, [CONTRAST]: false });

    expect(loadSettings()).toEqual({
      reducedMotion: true,
      highContrast: false,
      textSize: "normal",
      textSpacing: false,
    });
  });

  it("保存済みの完全な設定をそのまま読み出す", () => {
    const stored: A11ySettings = {
      reducedMotion: true,
      highContrast: true,
      textSize: "xx-large",
      textSpacing: true,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));

    expect(loadSettings()).toEqual(stored);
  });

  it("壊れた JSON のときは OS 既定値にフォールバックする", () => {
    stubMatchMedia({ [REDUCE]: true });
    localStorage.setItem(SETTINGS_KEY, "{ not valid json");

    expect(loadSettings()).toEqual({
      reducedMotion: true,
      highContrast: false,
      textSize: "normal",
      textSpacing: false,
    });
  });

  it("object 以外の JSON（null / 数値）は OS 既定値にフォールバックする", () => {
    localStorage.setItem(SETTINGS_KEY, "null");
    expect(loadSettings().textSize).toBe("normal");

    localStorage.setItem(SETTINGS_KEY, "42");
    expect(loadSettings().textSize).toBe("normal");
  });

  it("legacy schema（一部キー欠落）を欠けたフィールドだけ補完してマイグレーションする", () => {
    stubMatchMedia({ [REDUCE]: true, [CONTRAST]: true });
    // textSize / textSpacing / reducedMotion を持たない旧バージョンの保存値。
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ highContrast: false }));

    expect(loadSettings()).toEqual({
      reducedMotion: true, // OS 既定で補完
      highContrast: false, // 保存値を尊重
      textSize: "normal", // 既定で補完
      textSpacing: false, // 既定で補完
    });
  });

  it("不正な textSize 値は normal に矯正する", () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        reducedMotion: false,
        highContrast: false,
        textSize: "gigantic",
      })
    );

    expect(loadSettings().textSize).toBe("normal");
  });

  it("型が不正なフィールドは OS 既定値にフォールバックする", () => {
    stubMatchMedia({ [REDUCE]: true, [CONTRAST]: true });
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        reducedMotion: "yes",
        highContrast: 1,
        textSpacing: "no",
      })
    );

    const result = loadSettings();
    expect(result.reducedMotion).toBe(true); // OS 既定
    expect(result.highContrast).toBe(true); // OS 既定
    expect(result.textSpacing).toBe(false);
  });
});

describe("saveSettings", () => {
  it("localStorage に JSON を書き込み loadSettings と round-trip する", () => {
    const settings: A11ySettings = {
      reducedMotion: false,
      highContrast: true,
      textSize: "large",
      textSpacing: true,
    };

    saveSettings(settings);

    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}")).toEqual(
      settings
    );
    expect(loadSettings()).toEqual(settings);
  });
});

describe("applySettings", () => {
  it("有効な設定を data-* 属性として root に反映する", () => {
    applySettings({
      reducedMotion: true,
      highContrast: true,
      textSize: "large",
      textSpacing: true,
    });

    const root = document.documentElement;
    expect(root.getAttribute("data-a11y-reduced-motion")).toBe("true");
    expect(root.getAttribute("data-a11y-contrast")).toBe("high");
    expect(root.getAttribute("data-a11y-text-size")).toBe("large");
    expect(root.getAttribute("data-a11y-text-spacing")).toBe("enhanced");
  });

  it("無効な設定では真偽トグル属性を除去し、textSize は常に設定する", () => {
    const root = document.documentElement;
    // 先に有効化してから無効化し、確実に除去されることを確認する。
    applySettings({
      reducedMotion: true,
      highContrast: true,
      textSize: "large",
      textSpacing: true,
    });
    applySettings({
      reducedMotion: false,
      highContrast: false,
      textSize: "normal",
      textSpacing: false,
    });

    expect(root.hasAttribute("data-a11y-reduced-motion")).toBe(false);
    expect(root.hasAttribute("data-a11y-contrast")).toBe(false);
    expect(root.hasAttribute("data-a11y-text-spacing")).toBe(false);
    expect(root.getAttribute("data-a11y-text-size")).toBe("normal");
  });
});

describe("loadSettings / saveSettings storage exceptions", () => {
  it("getItem が例外を投げると OS 既定値にフォールバックする", () => {
    stubMatchMedia({ [REDUCE]: true });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(loadSettings()).toEqual({
      reducedMotion: true,
      highContrast: false,
      textSize: "normal",
      textSpacing: false,
    });
  });

  it("setItem が例外を投げても saveSettings は伝播させない", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(() =>
      saveSettings({
        reducedMotion: false,
        highContrast: false,
        textSize: "large",
        textSpacing: false,
      })
    ).not.toThrow();
  });
});

describe("initA11yMenu", () => {
  function setupMenu() {
    document.body.innerHTML = `
      <button class="a11y-toggle" aria-expanded="false" data-menu-id="a11y-menu"></button>
      <div id="a11y-menu" hidden>
        <input type="checkbox" data-a11y-reduced-motion />
        <input type="checkbox" data-a11y-high-contrast />
        <input type="checkbox" data-a11y-text-spacing-input />
        <select data-a11y-text-size>
          <option value="normal">normal</option>
          <option value="large">large</option>
        </select>
        <div data-a11y-live></div>
      </div>
    `;
    const toggle = document.querySelector<HTMLButtonElement>(".a11y-toggle")!;
    const menu = document.getElementById("a11y-menu")!;
    const textSizeInput = menu.querySelector<HTMLSelectElement>(
      "[data-a11y-text-size]"
    )!;
    return { toggle, menu, textSizeInput };
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("getItem が例外を投げても初期化を継続し、トグルでメニューが開く", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { toggle, menu } = setupMenu();

    initA11yMenu({ toggleSelector: ".a11y-toggle", menuId: "a11y-menu" });
    toggle.click();

    expect(menu.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("setItem が例外を投げても現在ページへの設定適用は続行する", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const { textSizeInput } = setupMenu();

    initA11yMenu({ toggleSelector: ".a11y-toggle", menuId: "a11y-menu" });
    textSizeInput.value = "large";
    textSizeInput.dispatchEvent(new Event("change"));

    expect(document.documentElement.getAttribute("data-a11y-text-size")).toBe(
      "large"
    );
  });

  it("保存が失敗し続けても、後続の設定変更で先の変更が失われない", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const { menu, textSizeInput } = setupMenu();
    const highContrastInput = menu.querySelector<HTMLInputElement>(
      "[data-a11y-high-contrast]"
    )!;

    initA11yMenu({ toggleSelector: ".a11y-toggle", menuId: "a11y-menu" });

    textSizeInput.value = "large";
    textSizeInput.dispatchEvent(new Event("change"));
    highContrastInput.checked = true;
    highContrastInput.dispatchEvent(new Event("change"));

    const root = document.documentElement;
    expect(root.getAttribute("data-a11y-text-size")).toBe("large");
    expect(root.getAttribute("data-a11y-contrast")).toBe("high");
  });
});
