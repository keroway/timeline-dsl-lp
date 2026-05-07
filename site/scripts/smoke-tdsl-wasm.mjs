import { readFile } from "node:fs/promises";

import init, { check_source, render_svg_from_source } from "../public/wasm/tdsl_wasm.js";
import { initSync } from "../public/wasm/tdsl_wasm.js";

const sample = `timeline "Sample" {
    title "Sample";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

lane "Project" as project { kind custom; order 10; }

event project 2026 "Kickoff" { id "event:kickoff"; };
`;

const wasmBytes = await readFile(new URL("../public/wasm/tdsl_wasm_bg.wasm", import.meta.url));

initSync({ module: wasmBytes });
await init();

const diagnostics = JSON.parse(check_source(sample));
const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
if (errors.length > 0) {
  throw new Error(`check_source returned errors: ${JSON.stringify(errors)}`);
}

const svg = render_svg_from_source(sample, 0);
if (!svg.includes("<svg") || !svg.includes("Kickoff")) {
  throw new Error("render_svg_from_source did not return the expected SVG output.");
}

console.log("WASM smoke passed: check_source and render_svg_from_source");
