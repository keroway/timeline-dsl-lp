import { readFile } from "node:fs/promises";

import init, {
  check_source,
  render_svg_from_source,
  render_svg_from_source_with_options,
  JsRenderOptions,
} from "../public/wasm/tdsl_wasm.js";
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

// group ブロック（v1.13.0〜）: グループラベルが SVG に描画されることを検証する
const groupSample = `timeline "Group Sample" {
    title "Group Sample";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

group "Team" {
    lane "Alpha" as alpha { kind custom; order 10; }
    lane "Beta" as beta { kind custom; order 20; }
}

event alpha 2026 "Milestone" { id "event:milestone"; };
`;

const groupDiagnostics = JSON.parse(check_source(groupSample));
const groupErrors = groupDiagnostics.filter((diagnostic) => diagnostic.severity === "error");
if (groupErrors.length > 0) {
  throw new Error(`check_source returned errors for group sample: ${JSON.stringify(groupErrors)}`);
}

const groupSvg = render_svg_from_source(groupSample, 0);
if (!groupSvg.includes("tdsl-group-label") || !groupSvg.includes("Team")) {
  throw new Error("render_svg_from_source did not render the group label (group block).");
}

// `now` キーワード（v1.23.0〜）: SystemTime::now() の wasm32 未実装によるクラッシュが
// v1.24.0 で修正されたことを確認する回帰テスト（#584）。
const nowSample = `timeline "Reign Period" {
    title "Reign Period";
    unit year;
    range 2019..2030;
    calendar proleptic_gregorian;
}

lane "Era" as era { kind custom; order 10; }
span era 2019..now "Reiwa" { tags ["era"]; id "span:reiwa"; };
`;

const nowDiagnostics = JSON.parse(check_source(nowSample));
const nowErrors = nowDiagnostics.filter((diagnostic) => diagnostic.severity === "error");
if (nowErrors.length > 0) {
  throw new Error(`check_source returned errors for now sample: ${JSON.stringify(nowErrors)}`);
}

const nowSvg = render_svg_from_source(nowSample, 0);
if (!nowSvg.includes("<svg") || !nowSvg.includes("Reiwa")) {
  throw new Error("render_svg_from_source did not render the now-keyword sample.");
}

// show_event_labels オプション (v1.17.0〜, Playground/Gallery の「ラベルを常時表示」トグルが使用):
// 有効化するとホバー不要でラベルテキストが追加描画されることを確認する。
const svgLabelsOff = render_svg_from_source(sample, 0);
const labelOptions = new JsRenderOptions();
labelOptions.show_event_labels = true;
const svgLabelsOn = render_svg_from_source_with_options(sample, 0, labelOptions);
const countOccurrences = (haystack, needle) => haystack.split(needle).length - 1;
if (countOccurrences(svgLabelsOn, "Kickoff") <= countOccurrences(svgLabelsOff, "Kickoff")) {
  throw new Error(
    "render_svg_from_source_with_options({ show_event_labels: true }) did not add an always-on label.",
  );
}

console.log(
  "WASM smoke passed: check_source, render_svg_from_source, group block, now keyword, show_event_labels option",
);
