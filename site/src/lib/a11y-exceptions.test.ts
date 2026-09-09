// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  ALLOWED_EXCEPTIONS,
  excludeExceptedNodes,
} from "../../scripts/lib/a11y-exceptions.mjs";

function violation(nodes: string[][]) {
  return {
    id: "scrollable-region-focusable",
    nodes: nodes.map((target) => ({ target })),
  };
}

describe("excludeExceptedNodes", () => {
  it("許容ノードのみの violation は全ノードが除外され空になる (#660)", () => {
    const result = excludeExceptedNodes(
      "/playground/",
      violation([["#preview-container", ".cm-scroller"]])
    );
    expect(result.nodes).toHaveLength(0);
  });

  it("許容外ノードのみの violation はそのまま残る (#660)", () => {
    const result = excludeExceptedNodes(
      "/playground/",
      violation([["#unrelated-scrollable"]])
    );
    expect(result.nodes).toHaveLength(1);
  });

  it("許容ノードと許容外ノードが混在する violation は許容外ノードだけ残す (#660)", () => {
    const result = excludeExceptedNodes(
      "/playground/",
      violation([
        ["#preview-container", ".cm-content"],
        ["#unrelated-scrollable"],
      ])
    );
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].target).toEqual(["#unrelated-scrollable"]);
  });

  it("例外が定義されていないページでは violation をそのまま返す", () => {
    const result = excludeExceptedNodes(
      "/gallery/",
      violation([["#unrelated-scrollable"]])
    );
    expect(result.nodes).toHaveLength(1);
  });

  it("例外が定義されていないルールでは violation をそのまま返す", () => {
    const result = excludeExceptedNodes("/playground/", {
      id: "color-contrast",
      nodes: [{ target: [".cm-scroller"] }],
    });
    expect(result.nodes).toHaveLength(1);
  });

  it("全ての許容例外に理由 (reason) が添えられている", () => {
    for (const exception of ALLOWED_EXCEPTIONS) {
      expect(exception.reason.length).toBeGreaterThan(0);
    }
  });
});
