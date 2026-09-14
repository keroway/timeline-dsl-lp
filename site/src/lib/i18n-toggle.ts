export const LOCALE_KEY = "tdsl-locale";

interface InitOpts {
  buttonSelector: string;
  currentLocale: string;
}

export function initLangToggle({
  buttonSelector,
  currentLocale,
}: InitOpts): void {
  const button = document.querySelector<HTMLButtonElement>(buttonSelector);
  if (!button) return;

  const targetLocale = currentLocale === "ja" ? "en" : "ja";

  button.addEventListener("click", () => {
    const currentPath = window.location.pathname;
    const { search, hash } = window.location;
    try {
      localStorage.setItem(LOCALE_KEY, targetLocale);
    } catch {
      // localStorage 無効環境（Safari private browsing 等）では永続化を諦め、
      // 今回の遷移だけ言語を切り替える。
    }

    let targetPath: string;
    if (targetLocale === "en") {
      targetPath = `/en${currentPath}`;
    } else {
      const stripped = currentPath.startsWith("/en")
        ? currentPath.slice(3)
        : currentPath;
      targetPath = stripped || "/";
    }

    window.location.assign(`${targetPath}${search}${hash}`);
  });
}
