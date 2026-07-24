import type { Locale } from "../i18n/index";

/**
 * 本番 origin。dev/preview では `Astro.site` が undefined になるためのフォールバック。
 * `astro.config.mjs` の `site` と一致させること。
 */
export const PRODUCTION_ORIGIN = "https://timeline-dsl-lp.pages.dev";

/**
 * `Astro.site`（本番ビルド時に解決）か、無ければ本番 origin を返す。
 * JSON-LD / OGP / canonical / hreflang の絶対 URL 化に使う単一ソース。
 */
export function getSiteUrl(astro: { site?: URL | undefined }): URL {
  return astro.site ?? new URL(PRODUCTION_ORIGIN);
}

/**
 * ロケールに応じて year/month/day を整形する。
 * 値が空または不正な日付なら null を返す。
 */
export function formatDate(
  value: string | null | undefined,
  locale: Locale
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
