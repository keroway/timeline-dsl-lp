import { EditorState } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
  keymap,
  highlightSpecialChars,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";

// CodeMirror 6 dark theme matching LP design tokens
const darkTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontSize: "0.86rem",
      fontFamily: "var(--font-mono)",
      background: "#121921",
      color: "#eaf1f8",
    },
    ".cm-content": {
      padding: "1rem",
      lineHeight: "1.62",
      caretColor: "#eaf1f8",
    },
    ".cm-gutters": {
      background: "#0e1520",
      // 行番号は WCAG 2.1 AA のコントラスト比 4.5:1 を満たす必要がある。
      // #6f8ea3 on #0e1520 ≈ 5.4:1（旧 #4e6a80 は約 3.3:1 で未達だった）。
      color: "#6f8ea3",
      border: "none",
      borderRight: "1px solid #1e2d3d",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 0.75rem 0 0.5rem",
      minWidth: "2rem",
    },
    ".cm-activeLine": { background: "rgba(255,255,255,0.04)" },
    ".cm-activeLineGutter": {
      background: "rgba(255,255,255,0.04)",
      color: "#8aabb8",
    },
    ".cm-selectionBackground, ::selection": {
      background: "#264f78 !important",
    },
    ".cm-matchingBracket": {
      background: "rgba(255,255,255,0.1)",
      outline: "1px solid #5a8a9f",
      color: "inherit",
    },
    ".cm-scroller": { overflow: "auto", fontFamily: "inherit" },
    // フォーカスリングは playground.css の `.cm-editor-host:focus-within` 側で
    // デザイントークン（--color-accent / --color-terminal-ink）を使って定義する。
    // EditorView.theme は CSS 変数を参照できないため、ここでは指定しない
    // （base theme の `1px dotted #212121` は CSS 側で上書きされる）。
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#eaf1f8" },
  },
  { dark: true },
);

export interface PlaygroundEditorOptions {
  host: HTMLElement;
  doc: string;
  /** doc が変更されるたびに呼ばれる（debounce 済みの再実行をキューイングする） */
  onDocChange: () => void;
}

// Playground 用 CodeMirror エディタを生成して host にマウントする。
export function createPlaygroundEditor({
  host,
  doc,
  onDocChange,
}: PlaygroundEditorOptions): EditorView {
  return new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        history(),
        drawSelection(),
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        bracketMatching(),
        indentOnInput(),
        EditorState.tabSize.of(4),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onDocChange();
        }),
        EditorView.contentAttributes.of({
          "aria-label": "Timeline DSL source editor",
          "data-smoke": "playground-editor-input",
        }),
        darkTheme,
      ],
    }),
    parent: host,
  });
}
