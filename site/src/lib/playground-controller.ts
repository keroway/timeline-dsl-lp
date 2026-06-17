import {
  checkTdslSource,
  renderTdslSvg,
  renderTdslHtml,
  setTdslWasmMessages,
  type TdslDiagnostic,
} from "./tdsl-wasm";
import { createPanZoom } from "./playground-pan-zoom";
import { buildShareUrl, extractSourceFromLocation, MAX_SHARE_URL_LENGTH } from "./playground-share";
import { createPlaygroundEditor } from "./playground-editor";
import type { PlaygroundSample } from "../data/playground-samples";
import type { PlaygroundMsgs } from "./playground-messages";
import { interpolate } from "../i18n/index";

// Playground の DOM 配線・WASM オーケストレーション・pan-zoom 連携を初期化する。
// PlaygroundPage.astro の <script> から一度だけ呼ぶ。
export function initPlayground(): void {
  const root = document.querySelector<HTMLElement>("[data-playground-root]");
  const editorHost = document.querySelector<HTMLElement>("[data-editor-host]");
  const sampleSelect = document.querySelector<HTMLSelectElement>("[data-sample-select]");
  const status = document.querySelector<HTMLElement>("[data-status]");
  const preview = document.querySelector<HTMLElement>("[data-preview]");
  const panZoomStage = document.querySelector<HTMLElement>("[data-pan-zoom-stage]");
  const panZoomReset = document.querySelector<HTMLButtonElement>("[data-pan-zoom-reset]");
  const diagnostics = document.querySelector<HTMLElement>("[data-diagnostics]");
  const editorMeta = document.querySelector<HTMLElement>("[data-editor-meta]");
  const previewMeta = document.querySelector<HTMLElement>("[data-preview-meta]");
  const diagnosticsMeta = document.querySelector<HTMLElement>("[data-diagnostics-meta]");
  const downloadTdslButton = document.querySelector<HTMLButtonElement>("[data-download-tdsl]");
  const downloadSvgButton = document.querySelector<HTMLButtonElement>("[data-download-svg]");
  const downloadHtmlButton = document.querySelector<HTMLButtonElement>("[data-download-html]");
  const openFileButton = document.querySelector<HTMLButtonElement>("[data-open-file]");
  const openFileInput = document.querySelector<HTMLInputElement>("[data-open-file-input]");
  const copyLinkButton = document.querySelector<HTMLButtonElement>("[data-copy-link]");
  const shareLive = document.querySelector<HTMLElement>("[data-share-live]");
  const scaleSelect = document.querySelector<HTMLSelectElement>("[data-scale-select]");
  const sampleDataElement = document.getElementById("playground-samples");
  const samples = JSON.parse(sampleDataElement?.textContent || "[]") as PlaygroundSample[];
  const i18nEl = document.getElementById("playground-i18n");
  const msgs = JSON.parse(i18nEl?.textContent || "{}") as PlaygroundMsgs;

  setTdslWasmMessages({
    fallback: msgs.wasmFallback,
    wikidataImportWarning: msgs.wasmWikidataImportWarning,
  });

  const panZoom =
    preview && panZoomStage
      ? createPanZoom({
          surface: preview,
          stage: panZoomStage,
          resetButton: panZoomReset,
          tooltipEl: document.getElementById("tdsl-tooltip"),
        })
      : null;

  const debounceMs = 420;
  let debounceTimer: number | undefined;
  let latestRunId = 0;
  let lastSvg = "";
  let lastSource = "";

  const setText = (element: HTMLElement | null, value: string) => {
    if (element) element.textContent = value;
  };

  const setStatus = (message: string, state: "loading" | "ready" | "error" | "warn") => {
    setText(status, message);
    root?.setAttribute("data-playground-state", state);
  };

  const updateEditorMeta = () => {
    setText(editorMeta, `${view.state.doc.lines} lines`);
  };

  const renderDiagnostics = (items: TdslDiagnostic[]) => {
    if (!diagnostics) return;

    const errorCount = items.filter((item) => item.severity === "error").length;
    const warningCount = items.filter((item) => item.severity === "warning").length;
    setText(diagnosticsMeta, `${errorCount} errors / ${warningCount} warnings`);

    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "diagnostics-empty";
      empty.textContent = msgs.diagnosticsEmpty;
      diagnostics.replaceChildren(empty);
      return;
    }

    const list = document.createElement("ol");
    list.className = "playground-diagnostic-list";
    for (const item of items) {
      const entry = document.createElement("li");
      entry.className = `playground-diagnostic ${item.severity}`;

      const severity = document.createElement("span");
      severity.textContent = item.severity === "error" ? msgs.severityError : msgs.severityWarn;

      const location = document.createElement("strong");
      location.textContent = item.line > 0 ? `${item.line}:${item.col}` : "global";

      const message = document.createElement("p");
      message.textContent = item.message;

      entry.append(severity, location, message);
      list.appendChild(entry);
    }
    diagnostics.replaceChildren(list);
  };

  const downloadText = (filename: string, mimeType: string, value: string) => {
    const blob = new Blob([value], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const setSvgContent = (target: HTMLElement, svgString: string) => {
    const parsed = new DOMParser().parseFromString(svgString, "image/svg+xml");
    const svgEl = parsed.documentElement;
    target.replaceChildren(svgEl);
  };

  const runPlayground = async () => {
    if (!preview) return;

    const stage = panZoomStage ?? preview;

    const runId = ++latestRunId;
    const source = view.state.doc.toString();
    updateEditorMeta();
    setStatus(msgs.statusChecking, "loading");
    setText(previewMeta, "checking");

    try {
      const result = await checkTdslSource(source);
      if (runId !== latestRunId) return;

      const hasErrors = result.some((item) => item.severity === "error");
      renderDiagnostics(result);

      if (hasErrors) {
        setStatus(msgs.statusError, "error");
        setText(previewMeta, lastSvg ? "previous preview kept" : "no preview");
        if (!lastSvg) {
          stage.replaceChildren(
            Object.assign(document.createElement("p"), { textContent: msgs.previewFixErrors }),
          );
        }
        return;
      }

      const renderScale = parseFloat(scaleSelect?.value ?? "0");
      const svg = await renderTdslSvg(source, renderScale);
      if (runId !== latestRunId) return;

      lastSvg = svg;
      lastSource = source;
      setSvgContent(stage, svg);
      panZoom?.applySvg();
      downloadSvgButton?.removeAttribute("disabled");
      downloadHtmlButton?.removeAttribute("disabled");
      setText(previewMeta, "updated");
      setStatus(
        result.length > 0 ? msgs.statusWarn : msgs.statusOk,
        result.length > 0 ? "warn" : "ready",
      );
    } catch (error) {
      if (runId !== latestRunId) return;

      const message = error instanceof Error ? error.message : String(error);
      renderDiagnostics([{ severity: "error", message, line: 0, col: 0 }]);
      setStatus(msgs.statusWasmFailed, "error");
      setText(previewMeta, lastSvg ? "previous preview kept" : "render failed");
      if (!lastSvg) {
        const errMsg = document.createElement("p");
        errMsg.textContent = msgs.previewRenderFailed;
        const retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.className = "preview-retry-btn";
        retryBtn.textContent = msgs.retry;
        retryBtn.addEventListener("click", () => queueRun());
        stage.replaceChildren(errMsg, retryBtn);
      }
    }
  };

  const queueRun = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(runPlayground, debounceMs);
  };

  const applySource = (source: string) => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: source },
    });
    updateEditorMeta();
    queueRun();
  };

  // Initialize CodeMirror editor (theme & extensions live in playground-editor.ts)
  const view = createPlaygroundEditor({
    host: editorHost!,
    doc: samples[0].source,
    onDocChange: queueRun,
  });

  void (async () => {
    const sharedSource = await extractSourceFromLocation(window.location.search);
    if (sharedSource !== null) {
      applySource(sharedSource);
      if (sampleSelect) sampleSelect.value = "";
    } else {
      updateEditorMeta();
      runPlayground();
    }
  })();

  sampleSelect?.addEventListener("change", () => {
    const sample = samples.find((item) => item.id === sampleSelect.value);
    if (sample) applySource(sample.source);
  });

  downloadTdslButton?.addEventListener("click", () => {
    downloadText("timeline.tdsl", "text/plain;charset=utf-8", view.state.doc.toString());
  });

  downloadSvgButton?.addEventListener("click", () => {
    if (lastSvg) downloadText("timeline.svg", "image/svg+xml;charset=utf-8", lastSvg);
  });

  downloadHtmlButton?.addEventListener("click", async () => {
    if (!lastSource) return;
    try {
      const html = await renderTdslHtml(lastSource);
      downloadText("timeline.html", "text/html;charset=utf-8", html);
    } catch {
      // ignore — button is only enabled after successful render
    }
  });

  openFileButton?.addEventListener("click", () => openFileInput?.click());

  const announceShare = (message: string) => {
    if (!shareLive) return;
    shareLive.textContent = "";
    // Force re-announcement when the same message fires twice in a row.
    window.requestAnimationFrame(() => {
      shareLive.textContent = message;
    });
  };

  copyLinkButton?.addEventListener("click", async () => {
    if (!copyLinkButton) return;
    const source = view.state.doc.toString();
    copyLinkButton.disabled = true;
    try {
      const result = await buildShareUrl({
        source,
        origin: window.location.origin,
        pathname: window.location.pathname,
      });
      if (!result.ok) {
        announceShare(interpolate(msgs.shareTooLong, { limit: String(MAX_SHARE_URL_LENGTH) }));
        return;
      }
      await navigator.clipboard.writeText(result.url);
      announceShare(msgs.shareCopySuccess);
    } catch {
      announceShare(msgs.shareCopyError);
    } finally {
      copyLinkButton.disabled = false;
    }
  });

  openFileInput?.addEventListener("change", () => {
    const file = openFileInput?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        applySource(reader.result);
        if (sampleSelect) sampleSelect.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
    openFileInput.value = "";
  });

  scaleSelect?.addEventListener("change", queueRun);

  // Custom tooltip for SVG preview items with data-tdsl-tooltip attribute
  const tooltipEl = document.getElementById("tdsl-tooltip");

  const hideTooltip = () => {
    if (!tooltipEl) return;
    tooltipEl.removeAttribute("data-visible");
    tooltipEl.setAttribute("aria-hidden", "true");
  };

  const showTooltip = (text: string, clientX: number, clientY: number) => {
    if (!tooltipEl) return;
    tooltipEl.textContent = text;
    tooltipEl.setAttribute("data-visible", "true");
    tooltipEl.setAttribute("aria-hidden", "false");

    const margin = 14;
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = clientX + margin;
    let top = clientY + margin;
    if (left + tw > vw - margin) left = clientX - tw - margin;
    if (top + th > vh - margin) top = clientY - th - margin;

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  preview?.addEventListener("pointermove", (event: PointerEvent) => {
    let target = event.target as Element | null;
    while (target && target !== preview) {
      const text = target.getAttribute("data-tdsl-tooltip");
      if (text) {
        showTooltip(text, event.clientX, event.clientY);
        return;
      }
      target = target.parentElement;
    }
    hideTooltip();
  });

  preview?.addEventListener("pointerleave", hideTooltip);
}
