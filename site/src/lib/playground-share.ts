export const MAX_SHARE_URL_LENGTH = 8192;
export const SHARE_QUERY_PARAM = "src";
export const LEGACY_SOURCE_QUERY_PARAM = "source";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return bytesToBase64Url(compressed);
}

export async function decodeShareSource(encoded: string): Promise<string> {
  const bytes = base64UrlToBytes(encoded);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(buffer);
}

export async function extractSourceFromLocation(search: string): Promise<string | null> {
  const params = new URLSearchParams(search);
  const compressed = params.get(SHARE_QUERY_PARAM);
  if (compressed) {
    try {
      return await decodeShareSource(compressed);
    } catch {
      return null;
    }
  }
  const legacy = params.get(LEGACY_SOURCE_QUERY_PARAM);
  return legacy ?? null;
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
