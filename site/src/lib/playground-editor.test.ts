import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createPlaygroundEditor } from "./playground-editor";

// CodeMirror を実際に jsdom 上にマウントして factory の構成を検証する。
// playground-controller.test.ts は createPlaygroundEditor を mock するため、
// ここが本ファイルの唯一の実マウント経路になる。

function mountHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createPlaygroundEditor", () => {
  it("初期 doc を保持した EditorView を host にマウントする", () => {
    const host = mountHost();
    const view = createPlaygroundEditor({
      host,
      doc: "event x",
      onDocChange: vi.fn(),
    });

    expect(view).toBeInstanceOf(EditorView);
    expect(view.state.doc.toString()).toBe("event x");
    // host 配下に CodeMirror のルート要素が生成される
    expect(host.querySelector(".cm-editor")).not.toBeNull();
    expect(host.querySelector(".cm-content")).not.toBeNull();

    view.destroy();
  });

  it("複数行 doc の行数を正しく反映する", () => {
    const host = mountHost();
    const view = createPlaygroundEditor({
      host,
      doc: "event a\nevent b\nevent c",
      onDocChange: vi.fn(),
    });

    expect(view.state.doc.lines).toBe(3);
    // lineNumbers extension により gutter が描画される
    expect(host.querySelector(".cm-lineNumbers")).not.toBeNull();

    view.destroy();
  });

  it("tabSize を 4 に設定する", () => {
    const host = mountHost();
    const view = createPlaygroundEditor({
      host,
      doc: "",
      onDocChange: vi.fn(),
    });

    expect(view.state.tabSize).toBe(4);

    view.destroy();
  });

  it("smoke / a11y 用の content 属性を付与する", () => {
    const host = mountHost();
    const view = createPlaygroundEditor({
      host,
      doc: "event x",
      onDocChange: vi.fn(),
    });

    const content = host.querySelector(".cm-content");
    expect(content?.getAttribute("aria-label")).toBe(
      "Timeline DSL source editor"
    );
    expect(content?.getAttribute("data-smoke")).toBe("playground-editor-input");

    view.destroy();
  });

  it("doc 変更時に onDocChange を呼ぶ", () => {
    const host = mountHost();
    const onDocChange = vi.fn();
    const view = createPlaygroundEditor({
      host,
      doc: "event x",
      onDocChange,
    });

    view.dispatch({
      changes: { from: view.state.doc.length, insert: "\nevent y" },
    });

    expect(onDocChange).toHaveBeenCalledTimes(1);
    expect(view.state.doc.toString()).toBe("event x\nevent y");

    view.destroy();
  });

  it("doc を変更しない dispatch では onDocChange を呼ばない", () => {
    const host = mountHost();
    const onDocChange = vi.fn();
    const view = createPlaygroundEditor({
      host,
      doc: "event x",
      onDocChange,
    });

    // 選択範囲だけ動かす（docChanged=false）
    view.dispatch({ selection: { anchor: 0 } });

    expect(onDocChange).not.toHaveBeenCalled();

    view.destroy();
  });

  it("dark theme を適用する", () => {
    const host = mountHost();
    const view = createPlaygroundEditor({
      host,
      doc: "event x",
      onDocChange: vi.fn(),
    });

    // dark: true の theme により EditorView.darkTheme facet が立つ
    expect(view.state.facet(EditorView.darkTheme)).toBe(true);

    view.destroy();
  });
});
