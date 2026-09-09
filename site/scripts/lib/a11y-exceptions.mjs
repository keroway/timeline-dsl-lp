// smoke-a11y.mjs の許容例外リストとノード単位のフィルタリング。
// axe-core の violation.nodes[].target (セレクタパス) を見て、既知の
// 許容ノードだけを取り除く。ページ・ルールが一致しても対象外のノードは
// 免除されず、violation として残る (#660)。

const CODEMIRROR_EXCEPTION_REASON =
  "CodeMirror 6 の .cm-scroller (axe が検知するスクロール領域) 自体は " +
  "フォーカス対象ではないが、内側の .cm-content は contenteditable かつ " +
  "常時 tabindex を持つため Tab で到達でき、矢印キーでのスクロールも可能。";

function isCodeMirrorNode(target) {
  return target.some(
    (selector) =>
      selector.includes(".cm-scroller") || selector.includes(".cm-content")
  );
}

// 既知の許容例外。理由を必ず添える。空配列なら例外なし。
// 形式: { page, ruleId, isExceptedNode(target), reason }
export const ALLOWED_EXCEPTIONS = [
  {
    page: "/playground/",
    ruleId: "scrollable-region-focusable",
    isExceptedNode: isCodeMirrorNode,
    reason: CODEMIRROR_EXCEPTION_REASON,
  },
  {
    page: "/en/playground/",
    ruleId: "scrollable-region-focusable",
    isExceptedNode: isCodeMirrorNode,
    reason: CODEMIRROR_EXCEPTION_REASON,
  },
];

// 対象ページ・ルールに一致する例外がある場合、その例外条件に合致するノードだけを
// violation.nodes から取り除く。一致する例外がなければ violation をそのまま返す。
export function excludeExceptedNodes(path, violation) {
  const exception = ALLOWED_EXCEPTIONS.find(
    (candidate) => candidate.page === path && candidate.ruleId === violation.id
  );
  if (!exception) {
    return violation;
  }
  return {
    ...violation,
    nodes: violation.nodes.filter(
      (node) => !exception.isExceptedNode(node.target)
    ),
  };
}
