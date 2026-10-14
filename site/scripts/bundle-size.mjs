import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// テストが fixture の dist を指せるよう env で上書きできる。
const distDir =
  process.env.BUNDLE_SIZE_DIST_DIR ??
  new URL("../dist", import.meta.url).pathname;

if (!existsSync(distDir)) {
  console.error("dist/ directory not found. Run pnpm build first.");
  process.exit(1);
}

const THRESHOLDS = {
  wasm: { warn: 810_000, fail: 860_000 },
  totalJs: { warn: 550_000, fail: 650_000 },
  maxJs: { warn: 370_000, fail: 420_000 },
  totalCss: { warn: 180_000, fail: 220_000 },
  maxCss: { warn: 70_000, fail: 90_000 },
};

function formatBytes(bytes) {
  return `${bytes.toLocaleString()} bytes (${(bytes / 1024).toFixed(1)} KB)`;
}

function evaluate(label, value, threshold) {
  if (value >= threshold.fail) {
    console.log(
      `  FAIL  ${label}: ${formatBytes(value)} >= fail=${formatBytes(threshold.fail)}`
    );
    return "fail";
  }
  if (value >= threshold.warn) {
    console.log(
      `  WARN  ${label}: ${formatBytes(value)} >= warn=${formatBytes(threshold.warn)} (fail=${formatBytes(threshold.fail)})`
    );
    return "warn";
  }
  console.log(
    `  PASS  ${label}: ${formatBytes(value)} (warn=${formatBytes(threshold.warn)}, fail=${formatBytes(threshold.fail)})`
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
if (!existsSync(astroDir)) {
  console.error(
    `dist/_astro directory not found: ${astroDir}\n` +
      "Astro's build output structure may have changed; bundle-size cannot verify JS/CSS budgets."
  );
  process.exit(1);
}

// サブディレクトリ配下のアセットも集計対象にする（相対パスで名前を持つ）。
const assetFiles = readdirSync(astroDir, { recursive: true })
  .map((f) => ({ name: f, size: statSync(join(astroDir, f)) }))
  .filter((f) => f.size.isFile())
  .map((f) => ({ name: f.name, size: f.size.size }));

const jsFiles = assetFiles.filter((f) => f.name.endsWith(".js"));
const cssFiles = assetFiles.filter((f) => f.name.endsWith(".css"));

// 検査対象が 0 件のまま PASS にしない（ビルド出力構造の変化を検査不能として扱う）。
for (const [label, files] of [
  ["JS", jsFiles],
  ["CSS", cssFiles],
]) {
  if (files.length === 0) {
    console.error(
      `No ${label} files found under ${astroDir}.\n` +
        "Astro's build output structure may have changed; bundle-size cannot verify budgets."
    );
    process.exit(1);
  }
}

const totalJs = jsFiles.reduce((sum, f) => sum + f.size, 0);
results.push(
  evaluate("Total JS (dist/_astro/*.js)", totalJs, THRESHOLDS.totalJs)
);

const maxJsFile = jsFiles.reduce((a, b) => (a.size >= b.size ? a : b), {
  name: "(none)",
  size: 0,
});
results.push(
  evaluate(`Max JS file (${maxJsFile.name})`, maxJsFile.size, THRESHOLDS.maxJs)
);

const totalCss = cssFiles.reduce((sum, f) => sum + f.size, 0);
results.push(
  evaluate("Total CSS (dist/_astro/*.css)", totalCss, THRESHOLDS.totalCss)
);

const maxCssFile = cssFiles.reduce((a, b) => (a.size >= b.size ? a : b), {
  name: "(none)",
  size: 0,
});
results.push(
  evaluate(
    `Max CSS file (${maxCssFile.name})`,
    maxCssFile.size,
    THRESHOLDS.maxCss
  )
);

const hasFail = results.includes("fail");
const hasWarn = results.includes("warn");

if (hasFail) {
  console.log(
    "\nbundle-size: FAILED (one or more metrics exceed fail threshold)"
  );
  process.exit(1);
}
if (hasWarn) {
  console.log(
    "\nbundle-size: WARNED (one or more metrics exceed warn threshold)"
  );
} else {
  console.log("\nbundle-size: all metrics within budget.");
}
