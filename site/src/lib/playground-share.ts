export const MAX_SHARE_URL_LENGTH = 8192;
// gzip 展開後のバイト数上限。高圧縮率データ(zip bomb)を想定し、
// URL 長の制限とは独立に、展開ストリームを読みながら判定する。
export const MAX_DECODED_SOURCE_BYTES = 1_000_000;
export const SHARE_QUERY_PARAM = "src";
export const LEGACY_SOURCE_QUERY_PARAM = "source";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(encoded: string): Uint8Array<ArrayBuffer> {
  const padded = encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encodeShareSource(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return bytesToBase64Url(compressed);
}

export async function decodeShareSource(encoded: string): Promise<string> {
  const bytes = base64UrlToBytes(encoded);
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_DECODED_SOURCE_BYTES) {
      await reader.cancel();
      throw new Error("decoded source exceeds MAX_DECODED_SOURCE_BYTES");
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}

export type ExtractSourceResult =
  | { status: "ok"; source: string }
  | { status: "invalid" }
  | { status: "none" };

export async function extractSourceFromLocation(
  search: string
): Promise<ExtractSourceResult> {
  const params = new URLSearchParams(search);
  const compressed = params.get(SHARE_QUERY_PARAM);
  if (compressed) {
    if (compressed.length > MAX_SHARE_URL_LENGTH) {
      return { status: "invalid" };
    }
    try {
      return { status: "ok", source: await decodeShareSource(compressed) };
    } catch {
      return { status: "invalid" };
    }
  }
  const legacy = params.get(LEGACY_SOURCE_QUERY_PARAM);
  if (legacy !== null) {
    if (legacy.length > MAX_SHARE_URL_LENGTH) {
      return { status: "invalid" };
    }
    return { status: "ok", source: legacy };
  }
  return { status: "none" };
}

export type BuildShareUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: "too_long"; length: number };

export async function buildShareUrl(options: {
  source: string;
  origin: string;
  pathname: string;
}): Promise<BuildShareUrlResult> {
  const encoded = await encodeShareSource(options.source);
  const url = `${options.origin}${options.pathname}?${SHARE_QUERY_PARAM}=${encoded}`;
  if (url.length > MAX_SHARE_URL_LENGTH) {
    return { ok: false, reason: "too_long", length: url.length };
  }
  return { ok: true, url };
}
