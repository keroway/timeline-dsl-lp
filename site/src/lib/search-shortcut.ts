/**
 * ⌘K / Ctrl+K 検索ショートカットの共通ロジック。
 * SiteHeader.astro（LP）と DocsSearch.astro（Starlight override）で共用する。 (#436)
 */

/**
 * キーボードイベントが検索ショートカット (⌘K / Ctrl+K) として扱われるべきかを判定する。
 *
 * - `key.toLowerCase() === "k"`: CapsLock / Shift で `"K"` になっても発火する。
 * - `!isComposing`: IME 変換確定の Enter 等に紛れて誤爆しないよう、変換中は無視する。
 * - `!repeat`: キーリピートで openSearch が連打されるのを防ぐ。
 */
export function isSearchShortcut(
  e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "isComposing" | "repeat">,
): boolean {
  if (e.isComposing || e.repeat) return false;
  if (!e.ctrlKey && !e.metaKey) return false;
  return e.key.toLowerCase() === "k";
}

/**
 * OS 判定して表示用のショートカットヒント文字列を返す（例: "⌘K" / "Ctrl+K"）。
 */
export function getSearchShortcutHint(
  platform: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
): string {
  const isMac = /Mac|iPhone|iPad|iPod/.test(platform);
  return isMac ? "⌘K" : "Ctrl+K";
}
