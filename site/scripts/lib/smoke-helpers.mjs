// smoke スクリプト共通ヘルパー。
// smoke-playground / smoke-seo / smoke-i18n で重複していた引数パース・HTTP 取得・
// 汎用アサーションを集約する。smoke 固有ロジック（assertCachePolicy / assertExcludes /
// importPlaywright 等）は各スクリプトのローカルに残す。

import { crc32, inflateSync } from "node:zlib";

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
      `${url} redirected with ${response.status}; smoke expects a directly served asset/page.`
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
  if (
    !expectedTypes.some((expectedType) =>
      contentType.toLowerCase().includes(expectedType)
    )
  ) {
    throw new Error(
      `${label} returned unexpected Content-Type: ${contentType || "(missing)"}`
    );
  }
}

export function assertIncludes(value, expected, label) {
  if (!value.includes(expected)) {
    throw new Error(`${label}. Expected to find: ${expected}`);
  }
}

// llms*.txt の本文が空・エラーページ相当でないことを判定する純粋関数（#886）。
// 正常な生成物に必ず現れる必須文字列（required）が全て含まれるかを調べ、
// 欠けているものを問題として返す。空本文は全 required が欠けるため必ず検出される。
export function findLlmsBodyProblems(body, required) {
  if (body.trim() === "") return ["body is empty"];
  return required
    .filter((needle) => !body.includes(needle))
    .map((needle) => `missing: ${needle}`);
}

// 受信 HTML の application/ld+json script 要素を JSON として解析し、required
// （'"@type":"Organization"' 形式）の @type が実ノードに存在するかを判定する純粋関数（#871）。
// script 要素なし・JSON 構文不正・HTML コメント内だけの @type は問題として返す。
export function findJsonLdProblems(html, required) {
  // 左から 1 パスで走査し、textarea / style / title の中身は丸ごと読み飛ばす。
  // script 要素は type 属性が厳密に application/ld+json のものだけを採る（data-type 等は不可）。
  const scripts = [];
  for (const [, tag, body, rawTag] of html
    .replace(/<!--[\s\S]*?-->/g, "")
    .matchAll(
      /<(?:script\b([^>]*)>([\s\S]*?)<\/script\s*>|(?:textarea|style|title)\b[^>]*>[\s\S]*?<\/(textarea|style|title)\s*>)/gi
    )) {
    if (rawTag !== undefined || tag === undefined) continue;
    for (const [, name, , dq, sq, bare] of tag.matchAll(
      /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g
    )) {
      if (
        name.toLowerCase() === "type" &&
        (dq ?? sq ?? bare).trim().toLowerCase() === "application/ld+json"
      ) {
        scripts.push(body);
      }
    }
  }
  if (scripts.length === 0) {
    return ["application/ld+json の script 要素がありません"];
  }
  const problems = [];
  const types = new Set();
  const collect = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) collect(item);
    } else if (node && typeof node === "object") {
      const type = node["@type"];
      for (const t of Array.isArray(type) ? type : [type]) {
        if (typeof t === "string") types.add(t);
      }
      for (const value of Object.values(node)) collect(value);
    }
  };
  for (const body of scripts) {
    try {
      collect(JSON.parse(body));
    } catch (error) {
      problems.push(`JSON-LD の JSON 構文が不正です: ${error.message}`);
    }
  }
  for (const needle of required) {
    const name = /^"@type":"(.+)"$/.exec(needle)?.[1];
    if (name === undefined) {
      problems.push(`required の形式が不正です: ${needle}`);
    } else if (!types.has(name)) {
      problems.push(`JSON-LD に @type ${name} がありません`);
    }
  }
  return problems;
}

// HTML コメントと生テキスト要素（script / style / textarea / title）の中身を除いた
// meta 要素のうち、属性 key=value を持つものの content を全て返す（#877）。
// jsdom 等の HTML パーサーは import 時に undici のグローバル dispatcher を差し替え、
// 組み込み fetch の圧縮レスポンス展開を壊すため、この共通ヘルパーでは使わない。
export function extractMetaContents(html, key, value) {
  const visible = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|textarea|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const contents = [];
  for (const [tag] of visible.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = new Map();
    for (const [, name, , dq, sq, bare] of tag.matchAll(
      /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g
    )) {
      attrs.set(name.toLowerCase(), dq ?? sq ?? bare);
    }
    if (attrs.get(key) === value && attrs.has("content")) {
      contents.push(attrs.get("content"));
    }
  }
  return contents;
}

// og:image の meta content 自体が期待パス image を指すかを判定する純粋関数（#877）。
// twitter:image やコメント内の一致では成功させない。origin は本番固定なので pathname で比較する。
// 返す path は画像取得に使う（参照が解決できなければ undefined）。
export function findOgImageProblems(html, image) {
  const contents = extractMetaContents(html, "property", "og:image");
  if (contents.length === 0) {
    return { problems: ["og:image の meta 要素（content 付き）がありません"] };
  }
  const paths = contents.map((content) => {
    try {
      return new URL(content, "http://localhost").pathname;
    } catch {
      return content;
    }
  });
  const wrong = paths.filter((path) => path !== image);
  if (wrong.length > 0) {
    return {
      problems: [
        `og:image が ${image} ではなく ${wrong.join(", ")} を指しています`,
      ],
    };
  }
  return { problems: [], path: paths[0] };
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// color type ごとのチャンネル数と許容 bit depth（PNG 仕様 11.2.2）。
const PNG_CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const PNG_BIT_DEPTHS = {
  0: [1, 2, 4, 8, 16],
  2: [8, 16],
  3: [1, 2, 4, 8],
  4: [8, 16],
  6: [8, 16],
};

// 配信された PNG 本体（Uint8Array）が PNG として有効で、実寸が width x height かを判定する純粋関数（#890）。
// 署名 8 バイト + IHDR チャンク（長さ 13・種別 "IHDR"・幅/高さ big-endian）を読み、
// 全チャンクを CRC 付きで走査して IDAT が zlib 展開でき IEND で終わることまで確認する（#892）。
export function findPngProblems(bytes, width, height) {
  if (bytes.length === 0) {
    return ["画像本文が空です"];
  }
  if (bytes.length < 24 || PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) {
    return ["PNG として不正な内容です（署名が一致しません）"];
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ihdr = String.fromCharCode(...bytes.subarray(12, 16));
  if (view.getUint32(8) !== 13 || ihdr !== "IHDR") {
    return ["PNG の IHDR チャンクが不正です"];
  }
  const actualWidth = view.getUint32(16);
  const actualHeight = view.getUint32(20);
  if (actualWidth !== width || actualHeight !== height) {
    return [
      `画像の実寸が ${actualWidth}x${actualHeight} です（期待 ${width}x${height}）`,
    ];
  }
  const idat = [];
  let sawIend = false;
  let offset = 8;
  while (offset < bytes.length) {
    if (sawIend) {
      return ["PNG の IEND 以降に余分なデータがあります"];
    }
    if (offset + 12 > bytes.length) {
      return ["PNG のチャンクが途中で切れています"];
    }
    const length = view.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) {
      return ["PNG のチャンクが途中で切れています"];
    }
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = crc32(bytes.subarray(offset + 4, offset + 8 + length));
    if (view.getUint32(offset + 8 + length) !== expectedCrc) {
      return [`PNG の ${type} チャンクの CRC が一致しません`];
    }
    if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      sawIend = true;
    }
    offset = end;
  }
  if (!sawIend) {
    return ["PNG に IEND チャンクがありません"];
  }
  if (idat.length === 0) {
    return ["PNG に IDAT チャンクがありません"];
  }
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const channels = PNG_CHANNELS[colorType];
  if (channels === undefined || !PNG_BIT_DEPTHS[colorType].includes(bitDepth)) {
    return [
      `PNG の IHDR が不正です（bit depth ${bitDepth} / color type ${colorType}）`,
    ];
  }
  if (bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] !== 0) {
    return ["PNG の IHDR が非対応です（圧縮・フィルター・インターレース方式）"];
  }
  let raw;
  try {
    raw = inflateSync(Buffer.concat(idat));
  } catch {
    return ["PNG の画像データ（IDAT）を展開できません"];
  }
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8) + 1;
  if (raw.length !== rowBytes * height) {
    return [
      `PNG の画素データが ${raw.length} バイトです（期待 ${rowBytes * height}）`,
    ];
  }
  for (let row = 0; row < height; row++) {
    if (raw[row * rowBytes] > 4) {
      return [`PNG の ${row} 行目のフィルター種別が不正です`];
    }
  }
  return [];
}

// Playground の WASM 初期化失敗が「見える形」で出ているかを判定する純粋関数（#847）。
// snapshot は { state, statusText, diagnosticsText, retryButtonText }。
// 説明文・loading 表示・DSL 診断エラーでは成功させず、失敗専用の状態・通知・再試行 UI を要求する。
export function findWasmFailureProblems(snapshot, { statusText, retryText }) {
  const problems = [];
  if (snapshot.state !== "error") {
    problems.push(
      `data-playground-state should be "error" (got ${JSON.stringify(snapshot.state)})`
    );
  }
  if ((snapshot.statusText ?? "").trim() !== statusText) {
    problems.push(
      `[data-status] should read ${JSON.stringify(statusText)} (got ${JSON.stringify(snapshot.statusText)})`
    );
  }
  if (!(snapshot.diagnosticsText ?? "").trim()) {
    problems.push("[data-diagnostics] should describe the init failure");
  }
  if ((snapshot.retryButtonText ?? "").trim() !== retryText) {
    problems.push(
      `.preview-retry-btn should be visible with ${JSON.stringify(retryText)} (got ${JSON.stringify(snapshot.retryButtonText)})`
    );
  }
  return problems;
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
