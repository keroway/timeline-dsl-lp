// Starlight の markdown table は `display: block; overflow: auto;` でスクロール可能領域になるが、
// table 要素自体には tabindex が付かずキーボードで操作できない
// (axe-core `scrollable-region-focusable`, WCAG 2.1.1)。table をキーボードフォーカス可能にする。
type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function markScrollableTables(node: HastNode): void {
  for (const child of node.children ?? []) {
    if (child.type === "element" && child.tagName === "table") {
      child.properties = {
        ...child.properties,
        tabIndex: 0,
        role: "region",
      };
    }
    markScrollableTables(child);
  }
}

export function rehypeScrollableTables() {
  return (tree: HastNode) => {
    markScrollableTables(tree);
  };
}
