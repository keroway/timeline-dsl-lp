// smoke スクリプト共通ヘルパー。
// smoke-playground / smoke-seo / smoke-i18n で重複していた引数パース・HTTP 取得・
// 汎用アサーションを集約する。smoke 固有ロジック（assertCachePolicy / assertExcludes /
// importPlaywright 等）は各スクリプトのローカルに残す。

export const DEFAULT_BASE_URL = "http://127.0.0.1:4321";

// CLI 引数をパースする。`--base-url <url>` / `--base-url=<url>` は常に解釈する。
// `booleanFlags` に渡したフラグ名（例: "browser"）は `--<name>` で true になり、
// 既定値 false で初期化される。未知の引数は throw する（許可しないフラグは throw 対象）。
export function parseArgs(rawArgs, { booleanFlags = [] } = {}) {
  const parsed = { baseUrl: undefined };
  for (const flag of booleanFlags) {
    parsed[flag] = false;
  }

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg.startsWith("--")) {
      const flagName = arg.slice(2);
      if (booleanFlags.includes(flagName)) {
        parsed[flagName] = true;
        continue;
      }
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

export function normalizeBaseUrl(value) {
  if (!value) return DEFAULT_BASE_URL;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

// リダイレクトを追わず取得する。3xx は smoke の前提（直接配信）を崩すため throw。
export async function get(url) {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(
      `${url} redirected with ${response.status}; smoke expects a directly served asset/page.`,
    );
  }
  return response;
}

export function assertStatus(response, label) {
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
}

export function assertContentType(response, label, expectedTypes) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!expectedTypes.some((expectedType) => contentType.toLowerCase().includes(expectedType))) {
    throw new Error(`${label} returned unexpected Content-Type: ${contentType || "(missing)"}`);
  }
}

export function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label}. Expected to find: ${expected}`);
  }
}

// ページ内の何らかのアクション（例: 言語トグルのクリック）が発生させるナビゲーションの
// 遷移先 pathname を、実際には遷移させずに捕捉する。
//
// 新しい Chromium では `Location.prototype.assign` が non-configurable になり、
// `Object.defineProperty(window.location, "assign", ...)` による上書きが
// `TypeError: Cannot redefine property: assign` で失敗するようになったため、
// `window.location` に一切触れず、Playwright の `page.route()` でナビゲーション
// リクエストをネットワークレベルで横取りして中断する方式に統一する。
export async function captureNavigationTarget(page, triggerFn) {
  let capturedUrl = null;

  const handler = async (route) => {
    const request = route.request();
    if (request.isNavigationRequest() && capturedUrl === null) {
      try {
        capturedUrl = new URL(request.url()).pathname;
      } catch {
        capturedUrl = request.url();
      }
      // 204 を返すとブラウザはナビゲーションを実行せず現在のドキュメントに留まる（RFC 9110 §15.3.5）。
      // route.abort() だと Chromium がエラーページ（opaque origin）に遷移してしまい、
      // 後続の localStorage アクセスが SecurityError になるため、fulfill で代替する。
      await route.fulfill({ status: 204, headers: {} });
      return;
    }
    await route.continue();
  };

  await page.route("**/*", handler);
  try {
    await triggerFn();
    // route ハンドラは非同期のため、abort が処理されるまで少し待つ。
    await page.waitForTimeout(200);
  } finally {
    await page.unroute("**/*", handler);
  }

  return capturedUrl;
}
