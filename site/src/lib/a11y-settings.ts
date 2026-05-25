export type A11yTextSize = "normal" | "large" | "extra-large" | "xx-large";

export interface A11yMessages {
  reducedMotion: { on: string; off: string };
  highContrast: { on: string; off: string };
  textSpacing: { on: string; off: string };
  textSize: (size: A11yTextSize) => string;
}

export interface A11ySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: A11yTextSize;
  textSpacing: boolean;
}

export const SETTINGS_KEY = "tdsl-a11y-settings";

const VALID_TEXT_SIZES: A11yTextSize[] = ["normal", "large", "extra-large", "xx-large"];

function isValidTextSize(v: unknown): v is A11yTextSize {
  return VALID_TEXT_SIZES.includes(v as A11yTextSize);
}

export function loadSettings(): A11ySettings {
  const osDefaults: A11ySettings = {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: window.matchMedia("(prefers-contrast: more)").matches,
    textSize: "normal",
    textSpacing: false,
  };
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return osDefaults;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return osDefaults;
    const p = parsed as Record<string, unknown>;
    return {
      reducedMotion: typeof p.reducedMotion === "boolean" ? p.reducedMotion : osDefaults.reducedMotion,
      highContrast: typeof p.highContrast === "boolean" ? p.highContrast : osDefaults.highContrast,
      textSize: isValidTextSize(p.textSize) ? p.textSize : "normal",
      textSpacing: typeof p.textSpacing === "boolean" ? p.textSpacing : false,
    };
  } catch {
    return osDefaults;
  }
}

export function saveSettings(settings: A11ySettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function applySettings(settings: A11ySettings): void {
  const root = document.documentElement;

  if (settings.reducedMotion) {
    root.setAttribute("data-a11y-reduced-motion", "true");
  } else {
    root.removeAttribute("data-a11y-reduced-motion");
  }

  if (settings.highContrast) {
    root.setAttribute("data-a11y-contrast", "high");
  } else {
    root.removeAttribute("data-a11y-contrast");
  }

  root.setAttribute("data-a11y-text-size", settings.textSize);

  if (settings.textSpacing) {
    root.setAttribute("data-a11y-text-spacing", "enhanced");
  } else {
    root.removeAttribute("data-a11y-text-spacing");
  }
}

const TEXT_SIZE_LABELS: Record<A11yTextSize, string> = {
  normal: "標準 (100%)",
  large: "大きく (125%)",
  "extra-large": "さらに大きく (150%)",
  "xx-large": "最大 (200%)",
};

const MESSAGES = {
  reducedMotion: { on: "動きを抑える設定を有効にしました", off: "動きを抑える設定を解除しました" },
  highContrast: { on: "高コントラスト表示を有効にしました", off: "高コントラスト表示を解除しました" },
  textSpacing: { on: "テキストの余白を広げました", off: "テキストの余白を標準に戻しました" },
  textSize: (size: A11yTextSize) => `文字サイズを${TEXT_SIZE_LABELS[size]}に変更しました`,
};

function announce(menuEl: HTMLElement, text: string) {
  const live = menuEl.querySelector<HTMLElement>("[data-a11y-live]");
  if (!live) return;
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = text; });
}

interface InitOpts {
  toggleSelector: string;
  menuId: string;
  messages?: A11yMessages;
}

export function initA11yMenu({ toggleSelector, menuId, messages }: InitOpts): void {
  const toggle = document.querySelector<HTMLButtonElement>(toggleSelector);
  const menu = document.getElementById(menuId);
  if (!toggle || !menu) return;

  const msgs = messages ?? MESSAGES;

  const reducedMotionInput = menu.querySelector<HTMLInputElement>("[data-a11y-reduced-motion]");
  const highContrastInput = menu.querySelector<HTMLInputElement>("[data-a11y-high-contrast]");
  const textSpacingInput = menu.querySelector<HTMLInputElement>("[data-a11y-text-spacing-input]");
  const textSizeInput = menu.querySelector<HTMLSelectElement>("[data-a11y-text-size]");

  function syncForm(settings: A11ySettings) {
    if (reducedMotionInput) reducedMotionInput.checked = settings.reducedMotion;
    if (highContrastInput) highContrastInput.checked = settings.highContrast;
    if (textSpacingInput) textSpacingInput.checked = settings.textSpacing;
    if (textSizeInput) textSizeInput.value = settings.textSize;
  }

  function getFirstFocusable(): HTMLElement | null {
    return menu!.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), button:not([disabled])'
    );
  }

  function closeMenu(restoreFocus = true) {
    toggle!.setAttribute("aria-expanded", "false");
    menu!.hidden = true;
    if (restoreFocus) toggle!.focus();
  }

  function openMenu() {
    toggle!.setAttribute("aria-expanded", "true");
    menu!.hidden = false;
    getFirstFocusable()?.focus();
  }

  const initial = loadSettings();
  applySettings(initial);
  syncForm(initial);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu();
    else openMenu();
  });

  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (menu.hidden) return;
    const target = e.target as Node;
    if (!menu.contains(target) && !toggle.contains(target)) {
      closeMenu(false);
    }
  });

  menu.addEventListener("focusout", () => {
    setTimeout(() => {
      const next = document.activeElement;
      if (next && !menu.contains(next) && next !== toggle) {
        closeMenu(false);
      }
    }, 0);
  });

  const bindCheckboxSetting = (
    input: HTMLInputElement | null,
    key: "reducedMotion" | "highContrast" | "textSpacing",
    getMessage: (s: A11ySettings) => string
  ): void => {
    input?.addEventListener("change", () => {
      const prev = loadSettings();
      const next: A11ySettings = { ...prev, [key]: input.checked };
      saveSettings(next);
      applySettings(next);
      if (prev[key] !== next[key]) {
        announce(menu, getMessage(next));
      }
    });
  };

  bindCheckboxSetting(reducedMotionInput, "reducedMotion", (s) =>
    msgs.reducedMotion[s.reducedMotion ? "on" : "off"]
  );
  bindCheckboxSetting(highContrastInput, "highContrast", (s) =>
    msgs.highContrast[s.highContrast ? "on" : "off"]
  );
  bindCheckboxSetting(textSpacingInput, "textSpacing", (s) =>
    msgs.textSpacing[s.textSpacing ? "on" : "off"]
  );

  textSizeInput?.addEventListener("change", () => {
    const prev = loadSettings();
    const newSize = isValidTextSize(textSizeInput.value) ? textSizeInput.value : "normal";
    const next = { ...prev, textSize: newSize };
    saveSettings(next);
    applySettings(next);
    if (prev.textSize !== next.textSize) {
      announce(menu, msgs.textSize(next.textSize));
    }
  });
}
