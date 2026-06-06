import type { DictionaryKeys, Locale } from "../i18n/index";

export type NavItem = {
  labelKey: DictionaryKeys;
  href: (locale: Locale) => string;
  isActive: (path: string) => boolean;
};

export const TOP_NAV: NavItem[] = [
  {
    labelKey: "nav.playground",
    href: () => "/playground/",
    isActive: (path) => path === "/playground/",
  },
  {
    labelKey: "nav.gallery",
    href: () => "/gallery/",
    isActive: (path) => path === "/gallery/",
  },
  {
    labelKey: "nav.showcase",
    href: (locale) => (locale === "ja" ? "/showcase/" : "/en/showcase/"),
    isActive: (path) =>
      path === "/showcase/" ||
      path === "/en/showcase/" ||
      path.startsWith("/showcase/") ||
      path.startsWith("/en/showcase/"),
  },
  {
    labelKey: "nav.docs",
    href: () => "/docs/",
    isActive: () => false,
  },
  {
    labelKey: "nav.changelog",
    href: () => "/changelog/",
    isActive: (path) => path === "/changelog/",
  },
  {
    labelKey: "nav.github",
    href: () => "https://github.com/keroway/timeline-dsl",
    isActive: () => false,
  },
];
