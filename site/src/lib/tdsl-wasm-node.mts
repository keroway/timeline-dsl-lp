import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

type WasmModule = {
  initSync: (opts: { module: BufferSource }) => unknown;
  render_svg_from_source: (source: string, scale: number) => string;
};

let renderFn: WasmModule["render_svg_from_source"] | null = null;

async function ensureInit(): Promise<void> {
  if (renderFn !== null) return;

  const root = process.cwd();
  const binaryPath = join(root, "public", "wasm", "tdsl_wasm_bg.wasm");
  const jsUrl = pathToFileURL(join(root, "public", "wasm", "tdsl_wasm.js")).href;

  const wasmBytes = await readFile(binaryPath);
  // public/ vendored WASM JS: dynamic import + @vite-ignore to skip Vite bundling
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mod = (await import(/* @vite-ignore */ jsUrl)) as WasmModule;
  mod.initSync({ module: wasmBytes });

  renderFn = mod.render_svg_from_source;
}

/**
 * Render a Timeline DSL source string to SVG (Node.js / build-time only).
 * @param scale pixels-per-year; 0 = auto-calculate from range
 */
export async function renderSvgFromSource(source: string, scale = 0): Promise<string> {
  await ensureInit();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return renderFn!(source, scale);
}
