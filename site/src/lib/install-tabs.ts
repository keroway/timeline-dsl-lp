// WAI-ARIA Tabs パターン（manual activation）の初期化ロジック（#430）。
// LP Install band のチャネル別タブ（Homebrew / Shell / PowerShell / Cargo）に使用する。
// JS 無効環境ではタブ / パネルとも通常のマークアップとして縦積み表示される
// プログレッシブエンハンスメントを前提とし、ここでは JS 実行時にのみ
// role="tablist" の見た目（アクティブ切替 + 矢印キー操作）を有効化する。

export interface InstallTabsRefs {
  tablist: HTMLElement;
  tabs: HTMLButtonElement[];
  panels: HTMLElement[];
}

export function queryInstallTabs(root: ParentNode): InstallTabsRefs | null {
  const tablist = root.querySelector<HTMLElement>("[data-install-tablist]");
  if (!tablist) return null;
  const tabs = Array.from(
    tablist.querySelectorAll<HTMLButtonElement>("[data-install-tab]")
  );
  const panels = tabs
    .map((tab) => {
      const panelId = tab.getAttribute("aria-controls");
      return panelId ? document.getElementById(panelId) : null;
    })
    .filter((el): el is HTMLElement => el !== null);
  if (tabs.length === 0 || tabs.length !== panels.length) return null;
  return { tablist, tabs, panels };
}

export function activateInstallTab(
  refs: InstallTabsRefs,
  index: number,
  focus = false
): void {
  const clamped = Math.max(0, Math.min(index, refs.tabs.length - 1));
  refs.tabs.forEach((tab, i) => {
    const active = i === clamped;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  refs.panels.forEach((panel, i) => {
    panel.hidden = i !== clamped;
  });
  if (focus) refs.tabs[clamped]?.focus();
}

export function initInstallTabs(root: ParentNode = document): void {
  const refs = queryInstallTabs(root);
  if (!refs) return;

  const initialIndex = refs.tabs.findIndex(
    (tab) => tab.getAttribute("aria-selected") === "true"
  );
  activateInstallTab(refs, initialIndex === -1 ? 0 : initialIndex);

  refs.tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateInstallTab(refs, index, true));
    tab.addEventListener("keydown", (e: KeyboardEvent) => {
      const lastIndex = refs.tabs.length - 1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        activateInstallTab(refs, index === lastIndex ? 0 : index + 1, true);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        activateInstallTab(refs, index === 0 ? lastIndex : index - 1, true);
      } else if (e.key === "Home") {
        e.preventDefault();
        activateInstallTab(refs, 0, true);
      } else if (e.key === "End") {
        e.preventDefault();
        activateInstallTab(refs, lastIndex, true);
      }
    });
  });
}
