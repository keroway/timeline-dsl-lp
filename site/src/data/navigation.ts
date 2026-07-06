import { localizedPath, type DictionaryKeys, type Locale } from "../i18n/index";

export type NavItem = {
  labelKey: DictionaryKeys;
  href: (locale: Locale) => string;
  isActive: (path: string) => boolean;
};

function isActiveInBothLocales(path: string, base: string): boolean {
  return path === localizedPath(base, "ja") || path === localizedPath(base, "en");
}

export const TOP_NAV: NavItem[] = [
  {
    labelKey: "nav.playground",
    href: (locale) => localizedPath("/playground/", locale),
    isActive: (path) => isActiveInBothLocales(path, "/playground/"),
  },
  {
    labelKey: "nav.gallery",
    href: (locale) => localizedPath("/gallery/", locale),
    isActive: (path) => isActiveInBothLocales(path, "/gallery/"),
  },
  {
    labelKey: "nav.showcase",
    href: (locale) => localizedPath("/showcase/", locale),
    isActive: (path) =>
      isActiveInBothLocales(path, "/showcase/") ||
      path.startsWith("/showcase/") ||
      path.startsWith("/en/showcase/"),
  },
  {
    labelKey: "nav.docs",
    href: (locale) => localizedPath("/docs/", locale),
    isActive: () => false,
  },
  {
    labelKey: "nav.changelog",
    href: (locale) => localizedPath("/changelog/", locale),
    isActive: (path) => isActiveInBothLocales(path, "/changelog/"),
  },
  {
    labelKey: "nav.github",
    href: () => "https://github.com/keroway/timeline-dsl",
    isActive: () => false,
  },
];
