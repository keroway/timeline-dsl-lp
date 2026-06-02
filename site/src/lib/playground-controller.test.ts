import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// WASM・CodeMirror・pan-zoom・共有 URL は collaborator として mock し、
// initPlayground 本体の状態オーケストレーション分岐だけを検証する。
const checkTdslSource = vi.fn();
const renderTdslSvg = vi.fn();
const renderTdslHtml = vi.fn();

vi.mock("./tdsl-wasm", () => ({
  checkTdslSource: (...args: unknown[]) => checkTdslSource(...args),
  renderTdslSvg: (...args: unknown[]) => renderTdslSvg(...args),
  renderTdslHtml: (...args: unknown[]) => renderTdslHtml(...args),
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

import { initPlayground } from "./playground-controller";

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
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("initPlayground runPlayground の状態分岐", () => {
  it("診断なし＆描画成功なら ready 状態になる", async () => {
    const dom = setupDom();
    checkTdslSource.mockResolvedValue([]);
    renderTdslSvg.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    initPlayground();

    await vi.waitFor(() => {
      expect(dom.root.getAttribute("data-playground-state")).toBe("ready");
    });
    expect(dom.status.textContent).toBe(MSGS.statusOk);
    expect(dom.diagnosticsMeta.textContent).toBe("0 errors / 0 warnings");
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
