// @vitest-environment node
import { describe, expect, it } from "vitest";

import { rehypeScrollableTables } from "./rehype-scrollable-tables";

describe("rehypeScrollableTables", () => {
  it("table 要素に tabindex=0 と role=region を付与する", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [],
        },
      ],
    };

    rehypeScrollableTables()(tree);

    expect(tree.children[0].properties).toEqual({
      tabIndex: 0,
      role: "region",
    });
  });

  it("table 以外の要素には触れない", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [],
        },
      ],
    };

    rehypeScrollableTables()(tree);

    expect(tree.children[0].properties).toEqual({});
  });

  it("ネストした table も検知する", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "div",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "table",
              properties: {},
              children: [],
            },
          ],
        },
      ],
    };

    rehypeScrollableTables()(tree);

    expect(tree.children[0].children[0].properties).toEqual({
      tabIndex: 0,
      role: "region",
    });
  });

  it("既存の properties を保持する", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: { className: ["foo"] },
          children: [],
        },
      ],
    };

    rehypeScrollableTables()(tree);

    expect(tree.children[0].properties).toEqual({
      className: ["foo"],
      tabIndex: 0,
      role: "region",
    });
  });
});
