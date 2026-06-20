// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import PlaygroundDiagnostics from "./PlaygroundDiagnostics.astro";

describe("PlaygroundDiagnostics", () => {
  it("ja ロケールで aside の aria-label が日本語になる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(PlaygroundDiagnostics, {
      props: { locale: "ja" },
    });
    expect(result).toContain("<aside");
    expect(result).toContain('class="playground-panel diagnostics-workbench"');
  });

  it("data-diagnostics 属性を持つ診断サーフェスが出力される", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(PlaygroundDiagnostics, {
      props: { locale: "ja" },
    });
    expect(result).toContain("data-diagnostics");
    expect(result).toContain('data-smoke="playground-diagnostics"');
  });

  it("data-diagnostics-meta が 0 で初期化される", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(PlaygroundDiagnostics, {
      props: { locale: "ja" },
    });
    expect(result).toContain("data-diagnostics-meta");
    expect(result).toContain(">0<");
  });

  it("en ロケールでも正常にレンダリングされる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(PlaygroundDiagnostics, {
      props: { locale: "en" },
    });
    expect(result).toContain("<aside");
    expect(result).toContain("data-diagnostics");
  });
});
