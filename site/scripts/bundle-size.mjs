import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distDir = new URL("../dist", import.meta.url).pathname;

if (!existsSync(distDir)) {
  console.error("dist/ directory not found. Run pnpm build first.");
  process.exit(1);
}

const THRESHOLDS = {
  wasm: { warn: 600_000, fail: 650_000 },
  totalJs: { warn: 550_000, fail: 650_000 },
  maxJs: { warn: 370_000, fail: 420_000 },
};

function formatBytes(bytes) {
  return `${bytes.toLocaleString()} bytes (${(bytes / 1024).toFixed(1)} KB)`;
}

function evaluate(label, value, threshold) {
  if (value >= threshold.fail) {
    console.log(`  FAIL  ${label}: ${formatBytes(value)} >= fail=${formatBytes(threshold.fail)}`);
    return "fail";
  }
  if (value >= threshold.warn) {
    console.log(
      `  WARN  ${label}: ${formatBytes(value)} >= warn=${formatBytes(threshold.warn)} (fail=${formatBytes(threshold.fail)})`,
    );
    return "warn";
  }
  console.log(
    `  PASS  ${label}: ${formatBytes(value)} (warn=${formatBytes(threshold.warn)}, fail=${formatBytes(threshold.fail)})`,
  );
  return "pass";
}

const results = [];

const wasmPath = join(distDir, "wasm", "tdsl_wasm_bg.wasm");
if (!existsSync(wasmPath)) {
  console.error(`WASM file not found: ${wasmPath}`);
  process.exit(1);
}
const wasmSize = statSync(wasmPath).size;
results.push(evaluate("WASM (tdsl_wasm_bg.wasm)", wasmSize, THRESHOLDS.wasm));

const astroDir = join(distDir, "_astro");
const jsFiles = existsSync(astroDir)
  ? readdirSync(astroDir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => ({ name: f, size: statSync(join(astroDir, f)).size }))
  : [];

const totalJs = jsFiles.reduce((sum, f) => sum + f.size, 0);
results.push(evaluate("Total JS (dist/_astro/*.js)", totalJs, THRESHOLDS.totalJs));

const maxJsFile = jsFiles.reduce((a, b) => (a.size >= b.size ? a : b), { name: "(none)", size: 0 });
results.push(evaluate(`Max JS file (${maxJsFile.name})`, maxJsFile.size, THRESHOLDS.maxJs));

const hasFail = results.includes("fail");
const hasWarn = results.includes("warn");

if (hasFail) {
  console.log("\nbundle-size: FAILED (one or more metrics exceed fail threshold)");
  process.exit(1);
}
if (hasWarn) {
  console.log("\nbundle-size: WARNED (one or more metrics exceed warn threshold)");
} else {
  console.log("\nbundle-size: all metrics within budget.");
}
