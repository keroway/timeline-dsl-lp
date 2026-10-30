import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./GalleryPage.astro", import.meta.url),
  "utf8"
);
const clientScript = source.match(/<script>\n([\s\S]*?)<\/script>/)?.[1] ?? "";

type Deferred = {
  options: { showEventLabels: boolean };
  resolve: (svg: string) => void;
};

const setup = async () => {
  const body = stripTypeScriptTypes(
    clientScript.replace(/^\s*import .*;\s*$/gm, "")
  );
  const calls: Deferred[] = [];
  const classes = new Set<string>();
  const preview = {
    innerHTML: "",
    classList: {
      add: (v: string) => classes.add(v),
      contains: (v: string) => classes.has(v),
    },
  };
  const toggle = {
    checked: false,
    listener: undefined as undefined | (() => void),
  };
  let intersect: undefined | ((entries: unknown[], obs: unknown) => void);
  const sample = { id: "s1", source: "x", title: "t" };
  const elements: Record<string, unknown> = {
    "gallery-samples-data": { textContent: JSON.stringify([sample]) },
    "gallery-i18n": { textContent: JSON.stringify({ locale: "ja" }) },
  };
  const context = {
    document: {
      getElementById: (id: string) => elements[id] ?? null,
      querySelector: (sel: string) => {
        if (sel.includes("show-event-labels-toggle")) {
          return {
            get checked() {
              return toggle.checked;
            },
            set checked(v: boolean) {
              toggle.checked = v;
            },
            addEventListener: (_: string, fn: () => void) => {
              toggle.listener = fn;
            },
          };
        }
        if (sel.startsWith("[data-gallery-preview=")) return preview;
        return null;
      },
      querySelectorAll: () => [],
    },
    window: {
      localStorage: { getItem: () => null, setItem: () => {} },
      IntersectionObserver: class {
        constructor(cb: (entries: unknown[], obs: unknown) => void) {
          intersect = cb;
        }
        observe() {}
        unobserve() {}
      },
    },
    IntersectionObserver: undefined as unknown,
    renderTdslSvgWithOptions: (
      _s: string,
      _o: unknown,
      options: Deferred["options"]
    ) => new Promise<string>((resolve) => calls.push({ options, resolve })),
    interpolate: () => "",
    JSON,
    String,
    Error,
    Map,
  };
  context.IntersectionObserver = context.window.IntersectionObserver;
  vm.runInNewContext(`(async () => {\n${body}\n})()`, context);
  intersect?.(
    [
      {
        isIntersecting: true,
        target: { getAttribute: () => sample.id },
      },
    ],
    { unobserve() {} }
  );
  return { calls, preview, toggle };
};

describe("GalleryPage ラベル常時表示トグル", () => {
  it("初回描画中にトグルを ON にすると、完了後のカードは ON の結果を持つ", async () => {
    const { calls, preview, toggle } = await setup();
    expect(calls).toHaveLength(1);
    expect(calls[0].options.showEventLabels).toBe(false);

    toggle.checked = true;
    toggle.listener?.();
    expect(calls).toHaveLength(2);
    expect(calls[1].options.showEventLabels).toBe(true);

    // 古い（OFF）描画が後から完了しても、新しい（ON）結果を上書きしない。
    calls[1].resolve("<svg>labels-on</svg>");
    await Promise.resolve();
    calls[0].resolve("<svg>labels-off</svg>");
    await new Promise((r) => setTimeout(r, 0));
    expect(preview.innerHTML).toBe("<svg>labels-on</svg>");
  });
});
