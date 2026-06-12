import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initLangToggle, LOCALE_KEY } from "./i18n-toggle";

// jsdom の window.location.assign は非 configurable で spy できないため、
// location 自体を pathname + assign mock を持つスタブへ差し替える。
const originalLocation = window.location;
let assignMock: ReturnType<typeof vi.fn>;

function setLocation(pathname: string): void {
  assignMock = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, assign: assignMock },
  });
}

function mountButton(): HTMLButtonElement {
  document.body.innerHTML = `<button id="lang-toggle"></button>`;
  return document.querySelector<HTMLButtonElement>("#lang-toggle")!;
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
    expect(() => initLangToggle({ buttonSelector: "#absent", currentLocale: "ja" })).not.toThrow();
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
});
