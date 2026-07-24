import { en } from "./en";
import {
  type Dictionary,
  type DictionaryKeys,
  type ExactDictionary,
  ja,
} from "./ja";

export type { Dictionary, DictionaryKeys, ExactDictionary };
export { en, ja };

const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

const dictionaries: Record<Locale, Dictionary> = { ja, en };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split("/");
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

export function resolveLocale(astro: {
  currentLocale?: string | undefined;
}): Locale {
  return isLocale(astro.currentLocale) ? astro.currentLocale : DEFAULT_LOCALE;
}

export function resolveLocaleFromLocation(
  loc: { href: string } = window.location
): Locale {
  return getLocaleFromUrl(new URL(loc.href));
}

export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === "ja") return normalized;
  return `/en${normalized}`;
}

export function getT(locale: Locale): (key: DictionaryKeys) => string {
  const dict = dictionaries[locale];
  return (key) => dict[key];
}

export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, v),
    template
  );
}
