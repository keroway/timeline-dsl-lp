import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SyncInitInput } from "../../public/wasm/tdsl_wasm";

/** Render options wrapping WASM's JsRenderOptions class. */
export interface SvgRenderOptions {
  /** Background grid density. @default "none" */
  grid?: "none" | "decade" | "year" | "month";
}

type WasmModule = {
  initSync: (opts: { module: SyncInitInput }) => unknown;
  render_svg_from_source: (source: string, scale: number) => string;
  render_svg_from_source_with_options: (source: string, scale: number, opts: WasmRenderOptions) => string;
  JsRenderOptions: new () => WasmRenderOptions;
};

type WasmRenderOptions = {
  grid: string;
  orientation: string;
  theme: string;
  show_table: boolean;
  show_event_labels: boolean;
  free: () => void;
};

let cachedModule: WasmModule | null = null;

async function ensureInit(): Promise<WasmModule> {
  if (cachedModule !== null) return cachedModule;

  const root = process.cwd();
  const binaryPath = join(root, "public", "wasm", "tdsl_wasm_bg.wasm");
  const jsUrl = pathToFileURL(join(root, "public", "wasm", "tdsl_wasm.js")).href;

  const wasmBytes = await readFile(binaryPath);
  const mod = (await import(/* @vite-ignore */ jsUrl)) as WasmModule;
  mod.initSync({ module: wasmBytes });

  cachedModule = mod;
  return mod;
}

/**
 * Render a Timeline DSL source string to SVG (Node.js / build-time only).
 * @param scale pixels-per-year; 0 = auto-calculate from range
 */
export async function renderSvgFromSource(source: string, scale = 0): Promise<string> {
  const mod = await ensureInit();
  return mod.render_svg_from_source(source, scale);
}

/**
 * Render SVG with additional options (grid, orientation, theme…).
 * @param scale pixels-per-year; 0 = auto-calculate
 * @param options render options (grid density etc.)
 */
export async function renderSvgFromSourceWithOptions(
  source: string,
  scale = 0,
  options: SvgRenderOptions = {},
): Promise<string> {
  const mod = await ensureInit();
  const opts = new mod.JsRenderOptions();
  // NOTE: render_svg_from_source_with_options internally calls opts.__destroy_into_raw(),
  // consuming the opts object (ptr becomes 0). Do NOT call opts.free() afterwards.
  if (options.grid !== undefined) opts.grid = options.grid;
  return mod.render_svg_from_source_with_options(source, scale, opts);
}
