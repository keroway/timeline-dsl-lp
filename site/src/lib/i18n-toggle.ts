export const LOCALE_KEY = "tdsl-locale";

// Pages without an /en/ version redirect to the English LP root
const EN_UNAVAILABLE_PREFIXES = ["/playground/", "/gallery/", "/changelog/", "/docs/"];

interface InitOpts {
  buttonSelector: string;
  currentLocale: string;
}

export function initLangToggle({ buttonSelector, currentLocale }: InitOpts): void {
  const button = document.querySelector<HTMLButtonElement>(buttonSelector);
  if (!button) return;

  const targetLocale = currentLocale === "ja" ? "en" : "ja";
  const unavailableMessage = button.dataset.unavailableMsg ?? "";

  button.addEventListener("click", () => {
    const currentPath = window.location.pathname;
    localStorage.setItem(LOCALE_KEY, targetLocale);

    let targetUrl: string;

    if (targetLocale === "en") {
      const isUnavailable = EN_UNAVAILABLE_PREFIXES.some((p) => currentPath.startsWith(p));
      if (isUnavailable) {
        const live = document.querySelector<HTMLElement>("[data-a11y-live]");
        if (live && unavailableMessage) {
          live.textContent = "";
          requestAnimationFrame(() => {
            live.textContent = unavailableMessage;
          });
        }
        targetUrl = "/en/";
      } else {
        targetUrl = `/en${currentPath}`;
      }
    } else {
      const stripped = currentPath.startsWith("/en") ? currentPath.slice(3) : currentPath;
      targetUrl = stripped || "/";
    }

    window.location.assign(targetUrl);
  });
}
