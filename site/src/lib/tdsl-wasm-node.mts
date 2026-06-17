import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { SyncInitInput } from "../../public/wasm/tdsl_wasm";

type WasmModule = {
  initSync: (opts: { module: SyncInitInput }) => unknown;
  render_svg_from_source: (source: string, scale: number) => string;
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
