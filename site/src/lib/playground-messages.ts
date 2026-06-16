import type { getT } from "../i18n/index";

/** Playground の i18n メッセージを辞書から構築する。
 * - `PlaygroundPage.astro` frontmatter から呼び、JSON 化して `<script>` に渡す。
 * - `playground-controller.ts` は JSON parse 後の値を `PlaygroundMsgs` 型で受け取る。
 * 辞書キーの一覧がここに集約されるため、キー追加漏れが型エラーで検知される。
 */
export function buildPlaygroundMsgs(t: ReturnType<typeof getT>) {
  return {
    statusInit: t("playground.status.init"),
    statusChecking: t("playground.status.checking"),
    statusError: t("playground.status.error"),
    statusWarn: t("playground.status.warn"),
    statusOk: t("playground.status.ok"),
    statusWasmFailed: t("playground.status.wasm_failed"),
    previewWaiting: t("playground.preview.waiting"),
    previewPlaceholder: t("playground.preview.placeholder"),
    previewFixErrors: t("playground.preview.fix_errors"),
    previewRenderFailed: t("playground.preview.render_failed"),
    diagnosticsWaiting: t("playground.diagnostics.waiting"),
    diagnosticsEmpty: t("playground.diagnostics.empty"),
    retry: t("playground.retry"),
    shareCopySuccess: t("playground.share.copy_success"),
    shareCopyError: t("playground.share.copy_error"),
    shareTooLong: t("playground.share.too_long"),
    severityError: t("playground.diagnostics.severity_error"),
    severityWarn: t("playground.diagnostics.severity_warn"),
    wasmFallback: t("playground.wasm.fallback"),
    wasmWikidataImportWarning: t("playground.wasm.wikidata_import_warning"),
  };
}

export type PlaygroundMsgs = ReturnType<typeof buildPlaygroundMsgs>;
