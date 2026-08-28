import { readFile } from "node:fs/promises";
import init, {
  check_source,
  initSync,
  JsRenderOptions,
  render_svg_from_source,
  render_svg_from_source_with_options,
} from "../public/wasm/tdsl_wasm.js";

const sample = `timeline "Sample" {
    title "Sample";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

lane "Project" as project { kind custom; order 10; }

event project 2026 "Kickoff" { id "event:kickoff"; };
`;

const wasmBytes = await readFile(
  new URL("../public/wasm/tdsl_wasm_bg.wasm", import.meta.url)
);

initSync({ module: wasmBytes });
await init();

const diagnostics = JSON.parse(check_source(sample));
const errors = diagnostics.filter(
  (diagnostic) => diagnostic.severity === "error"
);
if (errors.length > 0) {
  throw new Error(`check_source returned errors: ${JSON.stringify(errors)}`);
}

const svg = render_svg_from_source(sample, 0);
if (!svg.includes("<svg") || !svg.includes("Kickoff")) {
  throw new Error(
    "render_svg_from_source did not return the expected SVG output."
  );
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
const groupErrors = groupDiagnostics.filter(
  (diagnostic) => diagnostic.severity === "error"
);
if (groupErrors.length > 0) {
  throw new Error(
    `check_source returned errors for group sample: ${JSON.stringify(groupErrors)}`
  );
}

const groupSvg = render_svg_from_source(groupSample, 0);
if (!groupSvg.includes("tdsl-group-label") || !groupSvg.includes("Team")) {
  throw new Error(
    "render_svg_from_source did not render the group label (group block)."
  );
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
const nowErrors = nowDiagnostics.filter(
  (diagnostic) => diagnostic.severity === "error"
);
if (nowErrors.length > 0) {
  throw new Error(
    `check_source returned errors for now sample: ${JSON.stringify(nowErrors)}`
  );
}

const nowSvg = render_svg_from_source(nowSample, 0);
if (!nowSvg.includes("<svg") || !nowSvg.includes("Reiwa")) {
  throw new Error(
    "render_svg_from_source did not render the now-keyword sample."
  );
}

// show_event_labels オプション (v1.17.0〜, Playground/Gallery の「ラベルを常時表示」トグルが使用):
// 有効化するとホバー不要でラベルテキストが追加描画されることを確認する。
const svgLabelsOff = render_svg_from_source(sample, 0);
const labelOptions = new JsRenderOptions();
labelOptions.show_event_labels = true;
const svgLabelsOn = render_svg_from_source_with_options(
  sample,
  0,
  labelOptions
);
const countOccurrences = (haystack, needle) =>
  haystack.split(needle).length - 1;
if (
  countOccurrences(svgLabelsOn, "Kickoff") <=
  countOccurrences(svgLabelsOff, "Kickoff")
) {
  throw new Error(
    "render_svg_from_source_with_options({ show_event_labels: true }) did not add an always-on label."
  );
}

// 秒精度 + unit second（v1.27.0〜, #612-#614, ADR 0003）: `unit second;` と
// `YYYY-MM-DDTHH:MM:SSZ` 形式の時刻リテラルがパースエラーなく SVG に描画されることを検証する。
const secondSample = `timeline "Docking" {
    title "Docking";
    unit second;
    range 2024-03-04T12:00:00Z..2024-03-04T13:00:00Z;
    calendar proleptic_gregorian;
}

lane "Docking" as docking { kind custom; order 10; }

event docking 2024-03-04T12:34:56Z "Soft Capture" { id "event:soft-capture"; };
`;

const secondDiagnostics = JSON.parse(check_source(secondSample));
const secondErrors = secondDiagnostics.filter(
  (diagnostic) => diagnostic.severity === "error"
);
if (secondErrors.length > 0) {
  throw new Error(
    `check_source returned errors for unit-second sample: ${JSON.stringify(secondErrors)}`
  );
}

const secondSvg = render_svg_from_source(secondSample, 0);
if (!secondSvg.includes("<svg") || !secondSvg.includes("Soft Capture")) {
  throw new Error(
    "render_svg_from_source did not render the unit-second sample."
  );
}

// UTC オフセット（v1.27.0〜, #612-#616, ADR 0003）: `+HH:MM` / `-HH:MM` 形式の
// オフセット付き時刻リテラルがパースエラーなく SVG に描画されることを検証する。
const offsetSample = `timeline "Global Conference" {
    title "Global Conference";
    unit hour;
    range 2024-06-10T00:00Z..2024-06-11T00:00Z;
    calendar proleptic_gregorian;
}

lane "Tokyo" as tokyo { kind custom; order 10; }
lane "New York" as new_york { kind custom; order 20; }

event tokyo 2024-06-10T10:00+09:00 "Tokyo Opening" { id "event:tokyo:opening"; };
event new_york 2024-06-10T09:00-05:00 "NY Opening" { id "event:ny:opening"; };
`;

const offsetDiagnostics = JSON.parse(check_source(offsetSample));
const offsetErrors = offsetDiagnostics.filter(
  (diagnostic) => diagnostic.severity === "error"
);
if (offsetErrors.length > 0) {
  throw new Error(
    `check_source returned errors for UTC-offset sample: ${JSON.stringify(offsetErrors)}`
  );
}

const offsetSvg = render_svg_from_source(offsetSample, 0);
if (!offsetSvg.includes("<svg") || !offsetSvg.includes("Tokyo Opening")) {
  throw new Error(
    "render_svg_from_source did not render the UTC-offset sample."
  );
}

// offset 付き/なし混在（ADR 0003 D2）: 同一 span の start/end で offset の有無を
// 混在させると MixedOffsetComparison エラーになることを検証する。
const mixedOffsetSample = `timeline "Mixed Offset" {
    title "Mixed Offset";
    unit hour;
    range 2024-06-10T00:00Z..2024-06-11T00:00Z;
    calendar proleptic_gregorian;
}

lane "Ops" as ops { kind custom; order 10; }

span ops 2024-06-10T00:00+09:00..2024-06-10T12:00 "Mixed" { id "span:mixed"; };
`;

const mixedOffsetDiagnostics = JSON.parse(check_source(mixedOffsetSample));
const mixedOffsetErrors = mixedOffsetDiagnostics.filter(
  (diagnostic) => diagnostic.severity === "error"
);
if (mixedOffsetErrors.length === 0) {
  throw new Error(
    "check_source did not report MixedOffsetComparison for a span mixing offset and offset-less time values."
  );
}

// locale オプション（v2.1.0〜, #815/#817, LP側 #584）: 構造 aria-label プレフィックスが
// "en"（既定）/"ja" で切り替わることを検証する。source 由来のタイトル等は不変。
const localeDefaultOptions = new JsRenderOptions();
const svgLocaleDefault = render_svg_from_source_with_options(
  sample,
  0,
  localeDefaultOptions
);
if (!svgLocaleDefault.includes('aria-label="Event:')) {
  throw new Error(
    "render_svg_from_source_with_options with default locale did not emit the English 'Event:' aria-label prefix."
  );
}

const localeJaOptions = new JsRenderOptions();
localeJaOptions.locale = "ja";
const svgLocaleJa = render_svg_from_source_with_options(
  sample,
  0,
  localeJaOptions
);
if (
  !svgLocaleJa.includes("Kickoff") ||
  svgLocaleJa.includes('aria-label="Event:')
) {
  throw new Error(
    "render_svg_from_source_with_options with locale=\"ja\" still emitted the English 'Event:' aria-label prefix."
  );
}

console.log(
  "WASM smoke passed: check_source, render_svg_from_source, group block, now keyword, show_event_labels option, unit second, UTC offset, mixed-offset error, locale option"
);
