export type A11yTextSize = "normal" | "large" | "extra-large";

export interface A11ySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  textSize: A11yTextSize;
}

export const SETTINGS_KEY = "tdsl-a11y-settings";

const VALID_TEXT_SIZES: A11yTextSize[] = ["normal", "large", "extra-large"];

function isValidTextSize(v: unknown): v is A11yTextSize {
  return VALID_TEXT_SIZES.includes(v as A11yTextSize);
}

export function loadSettings(): A11ySettings {
  const osDefaults: A11ySettings = {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: window.matchMedia("(prefers-contrast: more)").matches,
    textSize: "normal",
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
}

interface InitOpts {
  toggleSelector: string;
  menuId: string;
}

export function initA11yMenu({ toggleSelector, menuId }: InitOpts): void {
  const toggle = document.querySelector<HTMLButtonElement>(toggleSelector);
  const menu = document.getElementById(menuId);
  if (!toggle || !menu) return;

  const reducedMotionInput = menu.querySelector<HTMLInputElement>("[data-a11y-reduced-motion]");
  const highContrastInput = menu.querySelector<HTMLInputElement>("[data-a11y-high-contrast]");
  const textSizeInput = menu.querySelector<HTMLSelectElement>("[data-a11y-text-size]");

  function syncForm(settings: A11ySettings) {
    if (reducedMotionInput) reducedMotionInput.checked = settings.reducedMotion;
    if (highContrastInput) highContrastInput.checked = settings.highContrast;
    if (textSizeInput) textSizeInput.value = settings.textSize;
  }

  const initial = loadSettings();
  applySettings(initial);
  syncForm(initial);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    menu.hidden = expanded;
  });

  document.addEventListener("click", (e) => {
    if (menu.hidden) return;
    const target = e.target as Node;
    if (!menu.contains(target) && !toggle.contains(target)) {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }
  });

  reducedMotionInput?.addEventListener("change", () => {
    const s = loadSettings();
    s.reducedMotion = reducedMotionInput.checked;
    saveSettings(s);
    applySettings(s);
  });

  highContrastInput?.addEventListener("change", () => {
    const s = loadSettings();
    s.highContrast = highContrastInput.checked;
    saveSettings(s);
    applySettings(s);
  });

  textSizeInput?.addEventListener("change", () => {
    const s = loadSettings();
    s.textSize = isValidTextSize(textSizeInput.value) ? textSizeInput.value : "normal";
    saveSettings(s);
    applySettings(s);
  });
}
