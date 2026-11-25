import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initLangToggle, LOCALE_KEY, LOCALE_SWITCH_EVENT } from "./i18n-toggle";
import { mustQuery } from "./test-dom-helpers";

// jsdom の window.location.assign は非 configurable で spy できないため、
// location 自体を pathname + assign mock を持つスタブへ差し替える。
const originalLocation = window.location;
let assignMock: ReturnType<typeof vi.fn>;

function setLocation(pathname: string, search = "", hash = ""): void {
  assignMock = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, search, hash, assign: assignMock },
  });
}

function mountButton(): HTMLButtonElement {
  document.body.innerHTML = `<button id="lang-toggle"></button>`;
  return mustQuery<HTMLButtonElement>(document, "#lang-toggle");
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("initLangToggle", () => {
  it("ボタンが存在しないときは例外を投げず early return する", () => {
    expect(() =>
      initLangToggle({ buttonSelector: "#absent", currentLocale: "ja" })
    ).not.toThrow();
  });

  it("ja→en: LOCALE_KEY に en を保存し /en プレフィックス付き URL へ遷移する", () => {
    setLocation("/");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "ja" });
    button.click();

    expect(localStorage.getItem(LOCALE_KEY)).toBe("en");
    expect(assignMock).toHaveBeenCalledWith("/en/");
  });

  it("ja→en: サブパスでも /en を前置する", () => {
    setLocation("/showcase/");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "ja" });
    button.click();

    expect(assignMock).toHaveBeenCalledWith("/en/showcase/");
  });

  it("en→ja: LOCALE_KEY に ja を保存し /en/showcase/ から /showcase/ へ戻す", () => {
    setLocation("/en/showcase/");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "en" });
    button.click();

    expect(localStorage.getItem(LOCALE_KEY)).toBe("ja");
    expect(assignMock).toHaveBeenCalledWith("/showcase/");
  });

  it("en→ja: /en/ はルート / に正規化する", () => {
    setLocation("/en/");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "en" });
    button.click();

    expect(assignMock).toHaveBeenCalledWith("/");
  });

  it("ja→en: 共有 URL のクエリと hash を引き継ぐ", () => {
    setLocation("/playground/", "?src=abc123", "#preview");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "ja" });
    button.click();

    expect(assignMock).toHaveBeenCalledWith(
      "/en/playground/?src=abc123#preview"
    );
  });

  it("en→ja: 共有 URL のクエリと hash を引き継ぐ", () => {
    setLocation("/en/playground/", "?src=abc123", "#preview");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "en" });
    button.click();

    expect(assignMock).toHaveBeenCalledWith("/playground/?src=abc123#preview");
  });

  it("遷移前に遷移先パスを載せた LOCALE_SWITCH_EVENT を dispatch する", () => {
    setLocation("/playground/", "?src=abc123");
    const button = mountButton();
    const listener = vi.fn();
    window.addEventListener(LOCALE_SWITCH_EVENT, listener);

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "ja" });
    button.click();
    window.removeEventListener(LOCALE_SWITCH_EVENT, listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({
      targetPath: "/en/playground/",
    });
    expect(assignMock).toHaveBeenCalledWith("/en/playground/?src=abc123");
  });

  it("LOCALE_SWITCH_EVENT が preventDefault されたら遷移も言語保存もしない", () => {
    setLocation("/playground/");
    const button = mountButton();
    const cancel = (event: Event) => event.preventDefault();
    window.addEventListener(LOCALE_SWITCH_EVENT, cancel);

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "ja" });
    button.click();
    window.removeEventListener(LOCALE_SWITCH_EVENT, cancel);

    expect(assignMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(LOCALE_KEY)).toBeNull();
  });

  it("setItem が例外を投げても言語切り替えの遷移は続行する", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    setLocation("/");
    const button = mountButton();

    initLangToggle({ buttonSelector: "#lang-toggle", currentLocale: "ja" });

    expect(() => button.click()).not.toThrow();
    expect(assignMock).toHaveBeenCalledWith("/en/");
  });
});
