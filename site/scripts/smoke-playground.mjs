const DEFAULT_BASE_URL = "http://127.0.0.1:4321";
const PLAYGROUND_PATH = "/playground/";
const WASM_JS_PATH = "/wasm/tdsl_wasm.js";
const WASM_BINARY_PATH = "/wasm/tdsl_wasm_bg.wasm";

const VALID_SAMPLE = `timeline "Smoke" {
    title "Smoke";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

lane "Project" as project { kind custom; order 10; }

event project 2026 "Kickoff" { id "event:kickoff"; };
`;

const BROKEN_SAMPLE = `timeline "Smoke" {
    title "Smoke";
    unit year;
    range 2025..2027;
    calendar proleptic_gregorian;
}

event project 2026 "Missing lane" { id "event:broken"; };
`;

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl ?? process.env.PLAYGROUND_BASE_URL ?? DEFAULT_BASE_URL);
const runBrowserSmoke = args.browser || process.env.PLAYGROUND_BROWSER_SMOKE === "1";

await smokeHttpSurface(baseUrl);

if (runBrowserSmoke) {
  await smokeBrowserFlow(baseUrl);
} else {
  console.log("Browser flow skipped. Add --browser to check editor, diagnostics, preview recovery, and visible WASM load errors.");
}

function parseArgs(rawArgs) {
  const parsed = { browser: false, baseUrl: undefined };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--browser") {
      parsed.browser = true;
      continue;
    }

    if (arg === "--base-url") {
      parsed.baseUrl = rawArgs[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--base-url=")) {
      parsed.baseUrl = arg.slice("--base-url=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function normalizeBaseUrl(value) {
  if (!value) {
    return DEFAULT_BASE_URL;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function smokeHttpSurface(rootUrl) {
  const playground = await get(`${rootUrl}${PLAYGROUND_PATH}`);
  assertStatus(playground, PLAYGROUND_PATH);
  assertContentType(playground, PLAYGROUND_PATH, ["text/html"]);

  const playgroundHtml = await playground.text();
  assertIncludes(playgroundHtml, "data-smoke=\"playground-editor\"", "playground editor smoke selector");
  assertIncludes(playgroundHtml, "data-smoke=\"playground-preview\"", "playground preview smoke selector");
  assertIncludes(playgroundHtml, "data-smoke=\"playground-diagnostics\"", "playground diagnostics smoke selector");

  const wasmJs = await get(`${rootUrl}${WASM_JS_PATH}`);
  assertStatus(wasmJs, WASM_JS_PATH);
  assertContentType(wasmJs, WASM_JS_PATH, ["application/javascript", "text/javascript"]);
  assertCachePolicy(wasmJs, WASM_JS_PATH);

  const wasmBinary = await get(`${rootUrl}${WASM_BINARY_PATH}`);
  assertStatus(wasmBinary, WASM_BINARY_PATH);
  assertContentType(wasmBinary, WASM_BINARY_PATH, ["application/wasm"]);
  assertCachePolicy(wasmBinary, WASM_BINARY_PATH);

  console.log(`HTTP smoke passed: ${PLAYGROUND_PATH}, ${WASM_JS_PATH}, and ${WASM_BINARY_PATH}`);
}

async function smokeBrowserFlow(rootUrl) {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const failedWasmResponses = [];
    const page = await context.newPage();

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/wasm/") && !response.ok()) {
        failedWasmResponses.push(`${response.status()} ${url}`);
      }
    });

    await page.goto(`${rootUrl}${PLAYGROUND_PATH}`, { waitUntil: "networkidle" });
    await page.locator('[data-smoke="playground-editor"]').first().waitFor({ state: "visible" });
    await page.locator('[data-smoke="playground-preview"] svg').first().waitFor({ state: "visible" });

    if (failedWasmResponses.length > 0) {
      throw new Error(`WASM asset request failed: ${failedWasmResponses.join(", ")}`);
    }

    const editor = page.locator('[data-smoke="playground-editor"]').first();
    const diagnostics = page.locator('[data-smoke="playground-diagnostics"]').first();

    await fillEditor(editor, BROKEN_SAMPLE);
    await diagnostics.waitFor({ state: "visible" });
    await page.waitForFunction(
      () => /error|エラー/i.test(document.querySelector('[data-smoke="playground-diagnostics"]')?.textContent ?? ""),
      undefined,
      { timeout: 5000 },
    );

    await fillEditor(editor, VALID_SAMPLE);
    await page.locator('[data-smoke="playground-preview"] svg').first().waitFor({ state: "visible" });

    await context.close();
    await smokeVisibleWasmFailure(rootUrl, browser);
  } finally {
    await browser.close();
  }

  console.log("Browser smoke passed: editor diagnostics, SVG preview recovery, and visible WASM load failure.");
}

async function smokeVisibleWasmFailure(rootUrl, browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/wasm/tdsl_wasm*", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "text/plain",
      body: "smoke: forced wasm asset failure",
    });
  });

  await page.goto(`${rootUrl}${PLAYGROUND_PATH}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => /WASM|読み込めません|load|failed|error|エラー/i.test(document.body.textContent ?? ""),
    undefined,
    { timeout: 5000 },
  );

  await context.close();
}

async function fillEditor(locator, value) {
  await locator.fill(value);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (cause) {
    throw new Error(
      "Playwright is required for --browser smoke. Install it in the current environment, then rerun `pnpm smoke:playground:browser -- --base-url <url>`.",
      { cause },
    );
  }
}

async function get(url) {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${url} redirected with ${response.status}; smoke expects a directly served asset/page.`);
  }

  return response;
}

function assertStatus(response, label) {
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
}

function assertContentType(response, label, expectedTypes) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!expectedTypes.some((expectedType) => contentType.toLowerCase().includes(expectedType))) {
    throw new Error(`${label} returned unexpected Content-Type: ${contentType || "(missing)"}`);
  }
}

function assertCachePolicy(response, label) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAgeMatch = /(?:^|,\s*)max-age=(\d+)/i.exec(cacheControl);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;

  if (/immutable/i.test(cacheControl) || maxAge > 3600) {
    throw new Error(`${label} uses an aggressive cache policy for an unversioned WASM asset: ${cacheControl}`);
  }
}

function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`Missing ${label}. Add ${expected} for the Playground smoke test contract.`);
  }
}
