import { beforeEach, describe, expect, it } from "vitest";
import { initInstallTabs } from "./install-tabs";

function mountTabs(): void {
  document.body.innerHTML = `
    <div role="tablist" data-install-tablist>
      <button role="tab" id="install-tab-a" aria-controls="install-panel-a" aria-selected="true" data-install-tab>A</button>
      <button role="tab" id="install-tab-b" aria-controls="install-panel-b" aria-selected="false" data-install-tab>B</button>
      <button role="tab" id="install-tab-c" aria-controls="install-panel-c" aria-selected="false" data-install-tab>C</button>
    </div>
    <div id="install-panel-a" role="tabpanel">A panel</div>
    <div id="install-panel-b" role="tabpanel">B panel</div>
    <div id="install-panel-c" role="tabpanel">C panel</div>`;
}

describe("initInstallTabs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("初期化時、最初のタブのみ表示しほかは hidden にする", () => {
    mountTabs();
    initInstallTabs();

    expect(document.getElementById("install-panel-a")!.hidden).toBe(false);
    expect(document.getElementById("install-panel-b")!.hidden).toBe(true);
    expect(document.getElementById("install-panel-c")!.hidden).toBe(true);
  });

  it("クリックでタブを切り替える（aria-selected / hidden が連動する）", () => {
    mountTabs();
    initInstallTabs();

    const tabB = document.getElementById("install-tab-b") as HTMLButtonElement;
    tabB.click();

    expect(tabB.getAttribute("aria-selected")).toBe("true");
    expect(
      document.getElementById("install-tab-a")!.getAttribute("aria-selected")
    ).toBe("false");
    expect(document.getElementById("install-panel-b")!.hidden).toBe(false);
    expect(document.getElementById("install-panel-a")!.hidden).toBe(true);
  });

  it("ArrowRight / ArrowLeft で次 / 前のタブへ移動し、端はループする", () => {
    mountTabs();
    initInstallTabs();

    const tabA = document.getElementById("install-tab-a") as HTMLButtonElement;
    const tabC = document.getElementById("install-tab-c") as HTMLButtonElement;

    tabA.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
    );
    expect(tabC.getAttribute("aria-selected")).toBe("true");

    tabC.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );
    expect(tabA.getAttribute("aria-selected")).toBe("true");
  });

  it("Home / End で最初 / 最後のタブへ移動する", () => {
    mountTabs();
    initInstallTabs();

    const tabA = document.getElementById("install-tab-a") as HTMLButtonElement;
    const tabC = document.getElementById("install-tab-c") as HTMLButtonElement;

    tabA.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true })
    );
    expect(tabC.getAttribute("aria-selected")).toBe("true");

    tabC.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true })
    );
    expect(tabA.getAttribute("aria-selected")).toBe("true");
  });

  it("対応するタブ / パネルが揃わないマークアップでは何もしない", () => {
    document.body.innerHTML = `<div data-install-tablist></div>`;
    expect(() => initInstallTabs()).not.toThrow();
  });
});
