export const LOCALE_KEY = "tdsl-locale";

/**
 * 言語切り替えの遷移直前に window へ dispatch するキャンセル可能なイベント。
 * ページ側（Playground 等）が遷移先へ状態を引き渡す口として使い、
 * 引き渡せないときは preventDefault で遷移を止められる（#879）。
 */
export const LOCALE_SWITCH_EVENT = "tdsl:locale-switch";

export interface LocaleSwitchDetail {
  targetPath: string;
}

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

    let targetPath: string;
    if (targetLocale === "en") {
      targetPath = `/en${currentPath}`;
    } else {
      const stripped = currentPath.startsWith("/en")
        ? currentPath.slice(3)
        : currentPath;
      targetPath = stripped || "/";
    }

    const proceed = window.dispatchEvent(
      new CustomEvent<LocaleSwitchDetail>(LOCALE_SWITCH_EVENT, {
        cancelable: true,
        detail: { targetPath },
      })
    );
    if (!proceed) return;

    try {
      localStorage.setItem(LOCALE_KEY, targetLocale);
    } catch {
      // localStorage 無効環境（Safari private browsing 等）では永続化を諦め、
      // 今回の遷移だけ言語を切り替える。
    }

    window.location.assign(`${targetPath}${search}${hash}`);
  });
}
