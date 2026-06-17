export type TdslDiagnosticSeverity = "error" | "warning";

export interface TdslDiagnostic {
  severity: TdslDiagnosticSeverity;
  message: string;
  line: number;
  col: number;
}

export interface TdslWasmApi {
  compileToIr(source: string): string;
  renderSvgFromSource(source: string, scale?: number): string;
  renderHtmlFromSource(source: string): string;
  checkSource(source: string): TdslDiagnostic[];
}

export type TdslWasmLoadResult =
  | { status: "ready"; api: TdslWasmApi }
  | { status: "unavailable"; message: string; cause?: unknown };

import type { InitInput } from "../../public/wasm/tdsl_wasm";

interface RawTdslWasmModule {
  default: (
    moduleOrPath?:
      | { module_or_path: InitInput | Promise<InitInput> }
      | InitInput
      | Promise<InitInput>,
  ) => Promise<unknown>;
  compile_to_ir(source: string): string;
  render_svg_from_source(source: string, scale: number): string;
  render_html_from_source(source: string): string;
  check_source(source: string): string;
}

const RENDER_SVG_AUTO_SCALE = 0;

export const TDSL_WASM_IMPORT_STRATEGY = {
  kind: "vendored-wasm-pack",
  source: "timeline-dsl/apps/webui/src/wasm",
  assetBasePath: "/wasm/",
  updateCommand:
    "wasm-pack build crates/tdsl-wasm --target web --out-dir apps/webui/src/wasm --no-opt",
} as const;

export interface TdslWasmMessages {
  fallback: string;
  wikidataImportWarning: string;
}

// locale 依存の文言は呼び出し側 (PlaygroundPage.astro の getT) から注入する。
// 注入前の早期参照には英語の安全側デフォルトを返す。
const DEFAULT_TDSL_WASM_MESSAGES: TdslWasmMessages = {
  fallback:
    "The browser build of Timeline DSL could not be loaded. Reload in an up-to-date browser, or use the local `tdsl check` / `tdsl render` CLI.",
  wikidataImportWarning:
    "The browser WASM build does not resolve Wikidata imports. Only static items are validated and rendered.",
};

let tdslWasmMessages: TdslWasmMessages = DEFAULT_TDSL_WASM_MESSAGES;

export function setTdslWasmMessages(messages: TdslWasmMessages): void {
  tdslWasmMessages = messages;
}

const TDSL_WASM_JS_URL = "/wasm/tdsl_wasm.js";
const TDSL_WASM_BINARY_URL = "/wasm/tdsl_wasm_bg.wasm";

let loadPromise: Promise<TdslWasmLoadResult> | undefined;

export function loadTdslWasm(): Promise<TdslWasmLoadResult> {
  loadPromise ??= loadTdslWasmModule();
  return loadPromise;
}

export async function checkTdslSource(source: string): Promise<TdslDiagnostic[]> {
  const loaded = await loadTdslWasm();
  if (loaded.status !== "ready") {
    return [toDiagnostic(loaded.message)];
  }

  return withWikidataImportWarning(source, loaded.api.checkSource(source));
}

export async function renderTdslSvg(source: string, scale?: number): Promise<string> {
  const loaded = await loadTdslWasm();
  if (loaded.status !== "ready") {
    throw new Error(loaded.message, { cause: loaded.cause });
  }

  return loaded.api.renderSvgFromSource(source, scale);
}

export async function renderTdslHtml(source: string): Promise<string> {
  const loaded = await loadTdslWasm();
  if (loaded.status !== "ready") {
    throw new Error(loaded.message, { cause: loaded.cause });
  }

  return loaded.api.renderHtmlFromSource(source);
}

export async function compileTdslToIr(source: string): Promise<string> {
  const loaded = await loadTdslWasm();
  if (loaded.status !== "ready") {
    throw new Error(loaded.message, { cause: loaded.cause });
  }

  return loaded.api.compileToIr(source);
}

async function loadTdslWasmModule(): Promise<TdslWasmLoadResult> {
  if (typeof window === "undefined" || typeof WebAssembly === "undefined") {
    return { status: "unavailable", message: tdslWasmMessages.fallback };
  }

  try {
    const rawModule = (await import(/* @vite-ignore */ TDSL_WASM_JS_URL)) as RawTdslWasmModule;
    await rawModule.default({ module_or_path: TDSL_WASM_BINARY_URL });

    return {
      status: "ready",
      api: {
        compileToIr: rawModule.compile_to_ir,
        renderSvgFromSource: (source, scale) =>
          rawModule.render_svg_from_source(source, scale ?? RENDER_SVG_AUTO_SCALE),
        renderHtmlFromSource: rawModule.render_html_from_source,
        checkSource(source) {
          return parseDiagnostics(rawModule.check_source(source));
        },
      },
    };
  } catch (cause) {
    return { status: "unavailable", message: tdslWasmMessages.fallback, cause };
  }
}

export function parseDiagnostics(raw: string): TdslDiagnostic[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [toDiagnostic("WASM diagnostic response was not an array.")];
    }

    return parsed.filter(isDiagnostic);
  } catch (cause) {
    return [toDiagnostic("WASM diagnostic response could not be parsed.", cause)];
  }
}

export function isDiagnostic(value: unknown): value is TdslDiagnostic {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    (item.severity === "error" || item.severity === "warning") &&
    typeof item.message === "string" &&
    typeof item.line === "number" &&
    typeof item.col === "number"
  );
}

export function withWikidataImportWarning(
  source: string,
  diagnostics: TdslDiagnostic[],
): TdslDiagnostic[] {
  if (!/(^|\n)\s*import\s+/.test(source)) {
    return diagnostics;
  }

  return [...diagnostics, toDiagnostic(tdslWasmMessages.wikidataImportWarning, "warning")];
}

export function toDiagnostic(
  message: string,
  severityOrCause: TdslDiagnosticSeverity | unknown = "error",
): TdslDiagnostic {
  return {
    severity: severityOrCause === "warning" ? "warning" : "error",
    message,
    line: 0,
    col: 0,
  };
}
