import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCopyButtons, initMotion } from "./lp-motion";

const REDUCE = "(prefers-reduced-motion: reduce)";

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
      }) as unknown as MediaQueryList,
  );
}

// document.execCommand は jsdom では未実装相当。フォールバック経路の戻り値を制御するため差し替える。
function setExecCommand(fn: ((command: string) => boolean) | undefined) {
  (document as unknown as { execCommand?: (command: string) => boolean }).execCommand = fn;
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.body.className = "";
  document.documentElement.removeAttribute("data-a11y-reduced-motion");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  setExecCommand(undefined);
});

function mountCopyButton(opts?: { text?: string; successLabel?: string; errorLabel?: string }) {
  const text = opts?.text ?? "npm install timeline-dsl";
  const success = opts?.successLabel ?? "コピーしました";
  const error = opts?.errorLabel ?? "コピーに失敗しました";
  document.body.innerHTML = `
    <div class="copy-wrap">
      <button data-copy-target="snippet" data-copy-success-label="${success}" data-copy-error-label="${error}">copy</button>
      <span class="copy-status"></span>
    </div>
    <pre id="snippet">${text}</pre>`;
  return {
    button: document.querySelector<HTMLButtonElement>("[data-copy-target]")!,
    status: document.querySelector<HTMLElement>(".copy-status")!,
  };
}

describe("initCopyButtons", () => {
  it("clipboard.writeText 成功時に trim 済みテキストをコピーし、1800ms 後に状態を解除する", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { button, status } = mountCopyButton({ text: "  hello world  " });

    initCopyButtons();
    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(writeText).toHaveBeenCalledWith("hello world");
    expect(button.classList.contains("is-copied")).toBe(true);
    expect(status.textContent).toBe("コピーしました");

    await vi.advanceTimersByTimeAsync(1800);
    expect(button.classList.contains("is-copied")).toBe(false);
    expect(status.textContent).toBe("");
  });

  it("clipboard が失敗したとき execCommand フォールバックで成功扱いにする", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    setExecCommand(execCommand);
    const { button, status } = mountCopyButton();

    initCopyButtons();
    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(button.classList.contains("is-copied")).toBe(true);
    expect(status.textContent).toBe("コピーしました");
  });

  it("navigator.clipboard 非対応環境では即座に execCommand フォールバックする", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {});
    const execCommand = vi.fn().mockReturnValue(true);
    setExecCommand(execCommand);
    const { button } = mountCopyButton();

    initCopyButtons();
    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("clipboard も execCommand も失敗したときエラーラベルを表示する", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
    });
    setExecCommand(vi.fn().mockReturnValue(false));
    const { button, status } = mountCopyButton({ errorLabel: "失敗しました" });

    initCopyButtons();
    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(button.classList.contains("is-copied")).toBe(false);
    expect(status.textContent).toBe("失敗しました");
  });

  it("コピー対象が空のときは何もしない（early return）", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { button, status } = mountCopyButton({ text: "" });

    initCopyButtons();
    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(writeText).not.toHaveBeenCalled();
    expect(status.textContent).toBe("");
  });
});

describe("initMotion", () => {
  it("prefers-reduced-motion: reduce のときモーション系 body クラスを付与しない", () => {
    stubMatchMedia({ [REDUCE]: true });
    document.body.innerHTML = `<div class="command-strip__command"></div><div class="editor-panel"></div>`;

    initMotion();

    expect(document.body.classList.contains("cli-strip-motion-enabled")).toBe(false);
    expect(document.body.classList.contains("hero-editor-motion-enabled")).toBe(false);
  });

  it("data-a11y-reduced-motion 属性があるときもモーションを無効化する", () => {
    stubMatchMedia({ [REDUCE]: false });
    document.documentElement.setAttribute("data-a11y-reduced-motion", "true");
    document.body.innerHTML = `<div class="command-strip__command"></div>`;

    initMotion();

    expect(document.body.classList.contains("cli-strip-motion-enabled")).toBe(false);
  });

  it("モーション許可時は該当要素に応じて body クラスを付与する", () => {
    stubMatchMedia({ [REDUCE]: false });
    document.body.innerHTML = `<div class="command-strip__command"></div><div class="editor-panel"></div>`;

    initMotion();

    expect(document.body.classList.contains("cli-strip-motion-enabled")).toBe(true);
    expect(document.body.classList.contains("hero-editor-motion-enabled")).toBe(true);
  });

  it("IntersectionObserver で交差した要素に is-visible を付与し unobserve する", () => {
    stubMatchMedia({ [REDUCE]: false });

    let ioCallback: IntersectionObserverCallback = () => {};
    const observe = vi.fn();
    const unobserve = vi.fn();
    class IOStub {
      observe = observe;
      unobserve = unobserve;
      disconnect = () => {};
      constructor(cb: IntersectionObserverCallback) {
        ioCallback = cb;
      }
    }
    vi.stubGlobal("IntersectionObserver", IOStub);
    // scroll ベースの即時 reveal が走らないよう rAF は no-op にする。
    vi.stubGlobal("requestAnimationFrame", () => 0);

    document.body.innerHTML = `<div class="section-header" id="a"></div><div class="section-header" id="b"></div>`;

    initMotion();

    const a = document.getElementById("a")!;
    const b = document.getElementById("b")!;
    expect(document.body.classList.contains("scroll-reveal-enabled")).toBe(true);
    expect(a.style.getPropertyValue("--reveal-delay")).toBe("0ms");
    expect(b.style.getPropertyValue("--reveal-delay")).toBe("80ms");
    expect(observe).toHaveBeenCalledTimes(2);

    // 交差を通知すると is-visible を付与し unobserve する。
    ioCallback(
      [{ isIntersecting: true, target: a } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(a.classList.contains("is-visible")).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(a);

    // 非交差エントリは無視する。
    ioCallback(
      [{ isIntersecting: false, target: b } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(b.classList.contains("is-visible")).toBe(false);
  });
});
