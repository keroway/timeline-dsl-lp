// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import InstallSection from "./InstallSection.astro";
import { INSTALL_CHANNELS } from "../../data/install-channels";

describe("InstallSection", () => {
  it("4 チャネル分の role=tab / role=tabpanel を出力する（#430）", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(InstallSection, {
      props: { locale: "ja" },
    });
    expect((result.match(/role="tab"/g) ?? []).length).toBe(INSTALL_CHANNELS.length);
    expect((result.match(/role="tabpanel"/g) ?? []).length).toBe(INSTALL_CHANNELS.length);
    for (const channel of INSTALL_CHANNELS) {
      expect(result).toContain(`id="install-tab-${channel.id}"`);
      expect(result).toContain(`id="install-panel-${channel.id}"`);
      for (const line of channel.lines) {
        expect(result).toContain(line);
      }
    }
  });

  it("role=tablist を持ち、最初のタブだけ aria-selected=true になっている", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(InstallSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain('role="tablist"');
    expect((result.match(/aria-selected="true"/g) ?? []).length).toBe(1);
  });

  it("その他の導入方法（/docs/homebrew/）への導線を含む", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(InstallSection, {
      props: { locale: "ja" },
    });
    expect(result).toContain('href="/docs/homebrew/"');
  });

  it("en ロケールでは /en/docs/homebrew/ を指す", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(InstallSection, {
      props: { locale: "en" },
    });
    expect(result).toContain('href="/en/docs/homebrew/"');
  });
});
