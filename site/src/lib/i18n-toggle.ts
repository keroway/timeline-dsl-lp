export const LOCALE_KEY = "tdsl-locale";

interface InitOpts {
  buttonSelector: string;
  currentLocale: string;
}

export function initLangToggle({ buttonSelector, currentLocale }: InitOpts): void {
  const button = document.querySelector<HTMLButtonElement>(buttonSelector);
  if (!button) return;

  const targetLocale = currentLocale === "ja" ? "en" : "ja";

  button.addEventListener("click", () => {
    const currentPath = window.location.pathname;
    localStorage.setItem(LOCALE_KEY, targetLocale);

    let targetUrl: string;
    if (targetLocale === "en") {
      targetUrl = `/en${currentPath}`;
    } else {
      const stripped = currentPath.startsWith("/en") ? currentPath.slice(3) : currentPath;
      targetUrl = stripped || "/";
    }

    window.location.assign(targetUrl);
  });
}
