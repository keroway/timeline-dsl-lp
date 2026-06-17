import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// WASM・CodeMirror・pan-zoom・共有 URL は collaborator として mock し、
// initPlayground 本体の状態オーケストレーション分岐だけを検証する。
const checkTdslSource = vi.fn();
const renderTdslSvg = vi.fn();
const renderTdslHtml = vi.fn();

const setTdslWasmMessages = vi.fn();

vi.mock("./tdsl-wasm", () => ({
  checkTdslSource: (...args: unknown[]) => checkTdslSource(...args),
  renderTdslSvg: (...args: unknown[]) => renderTdslSvg(...args),
  renderTdslHtml: (...args: unknown[]) => renderTdslHtml(...args),
  setTdslWasmMessages: (...args: unknown[]) => setTdslWasmMessages(...args),
}));

vi.mock("./playground-pan-zoom", () => ({
  createPanZoom: () => ({ applySvg: () => {} }),
}));

vi.mock("./playground-share", () => ({
  buildShareUrl: vi.fn(),
  extractSourceFromLocation: () => Promise.resolve(null),
  MAX_SHARE_URL_LENGTH: 8192,
}));

vi.mock("./playground-editor", () => ({
  createPlaygroundEditor: () => ({
    state: { doc: { toString: () => "event x", length: 7, lines: 1 } },
    dispatch: () => {},
  }),
}));

import {
  initPlayground,
  buildDiagnosticsFragment,
  createRunLoop,
  wireDownloads,
  wireShare,
  wireFileOpen,
  wireTooltip,
  wireScale,
} from "./playground-controller";

const MSGS = {
  statusInit: "init",
  statusChecking: "checking…",
  statusError: "エラーがあります",
  statusWarn: "警告があります",
  statusOk: "OK",
  statusWasmFailed: "WASM 失敗",
  previewWaiting: "waiting",
  previewPlaceholder: "placeholder",
  previewFixErrors: "エラーを直してください",
  previewRenderFailed: "描画に失敗しました",
  diagnosticsWaiting: "diag waiting",
  diagnosticsEmpty: "問題なし",
  retry: "再試行",
  shareCopySuccess: "copied",
  shareCopyError: "copy error",
  shareTooLong: "too long {limit}",
  severityError: "エラー",
  severityWarn: "警告",
  severityInfo: "情報",
  wasmFallback: "WASM フォールバック",
};

function setupDom() {
  document.body.innerHTML = `
    <div data-playground-root>
      <div data-editor-host></div>
      <p data-status></p>
      <p data-preview-meta></p>
      <p data-diagnostics-meta></p>
      <div data-preview>
        <div data-pan-zoom-stage></div>
      </div>
      <div data-diagnostics></div>
      <script type="application/json" id="playground-samples">[{"id":"a","source":"event x"}]</script>
      <script type="application/json" id="playground-i18n">${JSON.stringify(MSGS)}</script>
    </div>
  `;
  return {
    root: document.querySelector("[data-playground-root]")!,
    status: document.querySelector("[data-status]")!,
    diagnosticsMeta: document.querySelector("[data-diagnostics-meta]")!,
  };
}

beforeEach(() => {
  checkTdslSource.mockReset();
  renderTdslSvg.mockReset();
  renderTdslHtml.mockReset();
  setTdslWasmMessages.mockReset();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("initPlayground runPlayground の状態分岐", () => {
  it("起動時に setTdslWasmMessages へ i18n 化された WASM 文言を注入する", async () => {
    setupDom();
    checkTdslSource.mockResolvedValue([]);
    renderTdslSvg.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    initPlayground();

    expect(setTdslWasmMessages).toHaveBeenCalledWith({
      fallback: MSGS.wasmFallback,
    });
  });

  it("診断なし＆描画成功なら ready 状態になる", async () => {
    const dom = setupDom();
    checkTdslSource.mockResolvedValue([]);
    renderTdslSvg.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    initPlayground();

    await vi.waitFor(() => {
      expect(dom.root.getAttribute("data-playground-state")).toBe("ready");
    });
    expect(dom.status.textContent).toBe(MSGS.statusOk);
    expect(dom.diagnosticsMeta.textContent).toBe("0 errors / 0 warnings / 0 info");
    expect(renderTdslSvg).toHaveBeenCalledWith("event x", 0);
  });

  it("warning のみなら warn 状態になり描画は実行する", async () => {
    const dom = setupDom();
    checkTdslSource.mockResolvedValue([{ severity: "warning", message: "w", line: 1, col: 1 }]);
    renderTdslSvg.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    initPlayground();

    await vi.waitFor(() => {
      expect(dom.root.getAttribute("data-playground-state")).toBe("warn");
    });
    expect(dom.status.textContent).toBe(MSGS.statusWarn);
    expect(renderTdslSvg).toHaveBeenCalledOnce();
  });

  it("error があれば error 状態になり描画は実行しない", async () => {
    const dom = setupDom();
    checkTdslSource.mockResolvedValue([{ severity: "error", message: "e", line: 2, col: 3 }]);

    initPlayground();

    await vi.waitFor(() => {
      expect(dom.root.getAttribute("data-playground-state")).toBe("error");
    });
    expect(dom.status.textContent).toBe(MSGS.statusError);
    expect(renderTdslSvg).not.toHaveBeenCalled();
  });

  it("info-only 診断（error も warning も無い）なら ready 状態になり描画は実行する", async () => {
    const dom = setupDom();
    checkTdslSource.mockResolvedValue([{ severity: "info", message: "i", line: 1, col: 1 }]);
    renderTdslSvg.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    initPlayground();

    await vi.waitFor(() => {
      expect(dom.root.getAttribute("data-playground-state")).toBe("ready");
    });
    expect(dom.status.textContent).toBe(MSGS.statusOk);
    expect(renderTdslSvg).toHaveBeenCalledOnce();
  });

  it("描画が throw したら WASM 失敗ステータスの error 状態になる", async () => {
    const dom = setupDom();
    checkTdslSource.mockResolvedValue([]);
    renderTdslSvg.mockRejectedValue(new Error("render boom"));

    initPlayground();

    await vi.waitFor(() => {
      expect(dom.status.textContent).toBe(MSGS.statusWasmFailed);
    });
    expect(dom.root.getAttribute("data-playground-state")).toBe("error");
  });
});

describe("buildDiagnosticsFragment", () => {
  const msgs = {
    diagnosticsEmpty: "問題なし",
    severityError: "エラー",
    severityWarn: "警告",
    severityInfo: "情報",
  };

  it("items が空のとき diagnostics-empty な p を返し metaText は 0/0/0", () => {
    const { metaText, node } = buildDiagnosticsFragment([], msgs);
    expect(metaText).toBe("0 errors / 0 warnings / 0 info");
    const p = node as HTMLParagraphElement;
    expect(p.tagName).toBe("P");
    expect(p.className).toBe("diagnostics-empty");
    expect(p.textContent).toBe(msgs.diagnosticsEmpty);
  });

  it("error と warning が混在するとき ol で返し metaText に正しい件数が入る", () => {
    const items = [
      { severity: "error" as const, message: "e1", line: 1, col: 1 },
      { severity: "warning" as const, message: "w1", line: 2, col: 2 },
      { severity: "error" as const, message: "e2", line: 3, col: 3 },
    ];
    const { metaText, node } = buildDiagnosticsFragment(items, msgs);
    expect(metaText).toBe("2 errors / 1 warnings / 0 info");
    const ol = node as HTMLOListElement;
    expect(ol.tagName).toBe("OL");
    expect(ol.children).toHaveLength(3);
  });

  it("line が 0 のとき location テキストは 'global' になる", () => {
    const items = [{ severity: "error" as const, message: "global err", line: 0, col: 0 }];
    const { node } = buildDiagnosticsFragment(items, msgs);
    const ol = node as HTMLOListElement;
    const strong = ol.querySelector("strong");
    expect(strong?.textContent).toBe("global");
  });
});

describe("createRunLoop", () => {
  it("queueRun を呼ぶと debounceMs 後に run が実行される", async () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const { queueRun } = createRunLoop({ debounceMs: 100, run });

    queueRun();
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(run).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("連続して queueRun を呼ぶと最後の 1 回だけ run が実行される", async () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const { queueRun } = createRunLoop({ debounceMs: 100, run });

    queueRun();
    queueRun();
    queueRun();
    vi.advanceTimersByTime(100);
    expect(run).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});

describe("wireDownloads", () => {
  it("tdslBtn クリックで getSource の内容が downloadText に渡される", () => {
    const tdslBtn = document.createElement("button");
    const svgBtn = document.createElement("button");
    const htmlBtn = document.createElement("button");
    const getSource = vi.fn().mockReturnValue("source content");
    const getLastSvg = vi.fn().mockReturnValue("");
    const getLastSource = vi.fn().mockReturnValue("");

    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window, "URL", {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    wireDownloads({ tdslBtn, svgBtn, htmlBtn, getSource, getLastSvg, getLastSource });
    tdslBtn.click();

    expect(getSource).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
  });

  it("svgBtn クリックで getLastSvg が空のとき downloadText は呼ばれない", () => {
    const tdslBtn = document.createElement("button");
    const svgBtn = document.createElement("button");
    const htmlBtn = document.createElement("button");
    const getSource = vi.fn().mockReturnValue("");
    const getLastSvg = vi.fn().mockReturnValue("");
    const getLastSource = vi.fn().mockReturnValue("");

    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window, "URL", {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    wireDownloads({ tdslBtn, svgBtn, htmlBtn, getSource, getLastSvg, getLastSource });
    svgBtn.click();

    expect(createObjectURL).not.toHaveBeenCalled();
  });
});

describe("wireShare", () => {
  it("copyLinkButton クリックで buildShareUrl が呼ばれる", async () => {
    const { buildShareUrl: mockBuildShareUrl } = await import("./playground-share");
    const bsu = mockBuildShareUrl as ReturnType<typeof vi.fn>;
    bsu.mockResolvedValue({ ok: true, url: "https://example.com/share" });

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });

    const copyLinkButton = document.createElement("button");
    const shareLive = document.createElement("div");
    const msgs = {
      shareTooLong: "too long {limit}",
      shareCopySuccess: "copied",
      shareCopyError: "copy error",
    };
    const getSource = vi.fn().mockReturnValue("source");

    wireShare({ copyLinkButton, shareLive, msgs, getSource });
    copyLinkButton.click();

    await vi.waitFor(() => {
      expect(bsu).toHaveBeenCalled();
    });
  });
});

describe("wireFileOpen", () => {
  it("openFileButton クリックで openFileInput の click が呼ばれる", () => {
    const openFileButton = document.createElement("button");
    const openFileInput = document.createElement("input");
    openFileInput.type = "file";
    const inputClick = vi.spyOn(openFileInput, "click");
    const onApplySource = vi.fn();

    wireFileOpen({ openFileButton, openFileInput, sampleSelect: null, onApplySource });
    openFileButton.click();

    expect(inputClick).toHaveBeenCalled();
  });
});

describe("wireTooltip", () => {
  it("preview が null でもエラーにならない", () => {
    expect(() => wireTooltip({ preview: null, tooltipEl: null })).not.toThrow();
  });

  it("pointerleave で tooltipEl の data-visible が削除される", () => {
    const preview = document.createElement("div");
    const tooltipEl = document.createElement("div");
    tooltipEl.setAttribute("data-visible", "true");
    tooltipEl.setAttribute("aria-hidden", "false");

    wireTooltip({ preview, tooltipEl });
    preview.dispatchEvent(new PointerEvent("pointerleave"));

    expect(tooltipEl.hasAttribute("data-visible")).toBe(false);
    expect(tooltipEl.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("wireScale", () => {
  it("scaleSelect の change で onRun が呼ばれる", () => {
    const scaleSelect = document.createElement("select");
    const onRun = vi.fn();

    wireScale({ scaleSelect, onRun });
    scaleSelect.dispatchEvent(new Event("change"));

    expect(onRun).toHaveBeenCalledOnce();
  });

  it("scaleSelect が null でもエラーにならない", () => {
    const onRun = vi.fn();
    expect(() => wireScale({ scaleSelect: null, onRun })).not.toThrow();
  });
});
