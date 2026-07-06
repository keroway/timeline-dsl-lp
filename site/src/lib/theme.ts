// LP / Playground / Gallery / Changelog のテーマ切替（#431）。
// Starlight（Docs）の ThemeSelect と完全に同じ localStorage キー（`starlight-theme`）と
// `<html data-theme="light|dark">` の適用規則を共有することで、Docs ⇄ LP 系ページの
// 往復でテーマが保持される（相互同期のために独自のブリッジ処理は不要）。
// 参照: site/node_modules/@astrojs/starlight/components/ThemeSelect.astro / ThemeProvider.astro
export type Theme = "auto" | "dark" | "light";

const STORAGE_KEY = "starlight-theme";

export function parseTheme(value: unknown): Theme {
  return value === "auto" || value === "dark" || value === "light" ? value : "auto";
}

export function loadTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "auto";
  }
}

export function storeTheme(theme: Theme): void {
  try {
    // Starlight は auto を空文字列として保存する（parseTheme が undefined/"" を auto 扱いする）。
    localStorage.setItem(STORAGE_KEY, theme === "light" || theme === "dark" ? theme : "");
  } catch {
    // localStorage 無効環境（Safari private browsing 等）では永続化を諦め、当該セッション内の
    // 見た目だけ適用する。
  }
}

export function getPreferredColorScheme(): "light" | "dark" {
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveAppliedTheme(theme: Theme): "light" | "dark" {
  return theme === "auto" ? getPreferredColorScheme() : theme;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = resolveAppliedTheme(theme);
}

export interface InitThemeToggleOpts {
  selectSelector: string;
}

export function initThemeToggle({ selectSelector }: InitThemeToggleOpts): void {
  const selects = document.querySelectorAll<HTMLSelectElement>(selectSelector);
  if (selects.length === 0) return;

  const syncSelects = (theme: Theme) => {
    selects.forEach((select) => {
      select.value = theme;
    });
  };

  const onThemeChange = (theme: Theme): void => {
    applyTheme(theme);
    storeTheme(theme);
    syncSelects(theme);
  };

  // ページ読み込み時の data-theme は BaseLayout の inline FOUC 防止スクリプトで既に適用済みだが、
  // ここでも applyTheme を呼び直して、このモジュール単体でも幂等に正しい状態になるようにする。
  const initial = loadTheme();
  applyTheme(initial);
  syncSelects(initial);

  selects.forEach((select) => {
    select.addEventListener("change", () => {
      onThemeChange(parseTheme(select.value));
    });
  });

  // OS のカラースキーム変更に追従するのは "auto" を選んでいるときだけ（Starlight と同一挙動）。
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (loadTheme() === "auto") applyTheme("auto");
  });
}
