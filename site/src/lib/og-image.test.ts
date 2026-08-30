// @vitest-environment node
import { describe, expect, it } from "vitest";

import { LANE_HEX_LIGHT as LANE_HEX } from "./lane-palette";
import { buildOgSvg, OG_CARDS, OG_HEIGHT, OG_WIDTH } from "./og-image";

describe("buildOgSvg", () => {
  for (const [key, spec] of Object.entries(OG_CARDS)) {
    it(`renders a valid svg for OG_CARDS.${key}`, () => {
      const svg = buildOgSvg(spec);
      expect(svg).toMatch(
        new RegExp(
          `^<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}"`
        )
      );
      expect(svg.trimEnd()).toMatch(/<\/svg>$/);
      expect(svg).toContain(LANE_HEX[spec.accent]);
    });
  }

  it("shifts wordmark/subtitle down when eyebrow is present", () => {
    const withEyebrow = buildOgSvg(OG_CARDS.playground);
    const withoutEyebrow = buildOgSvg(OG_CARDS.default);

    expect(withEyebrow).toContain('y="392"');
    expect(withEyebrow).toContain('y="452"');
    expect(withoutEyebrow).toContain('y="364"');
    expect(withoutEyebrow).toContain('y="424"');
  });

  it("renders the eyebrow text uppercased when present", () => {
    const svg = buildOgSvg(OG_CARDS.gallery);
    const eyebrow = OG_CARDS.gallery.eyebrow;
    expect(eyebrow).toBeDefined();
    expect(svg).toContain(eyebrow?.toUpperCase());
  });

  it("omits eyebrow markup when spec has no eyebrow", () => {
    const svg = buildOgSvg(OG_CARDS.default);
    expect(svg).not.toContain('letter-spacing="6"');
  });

  it("escapes XML-sensitive characters in the subtitle", () => {
    const svg = buildOgSvg({
      subtitle: `Tom & Jerry <"quoted">`,
      accent: "warm",
    });
    expect(svg).toContain("Tom &amp; Jerry &lt;&quot;quoted&quot;&gt;");
    expect(svg).not.toContain(`Tom & Jerry <"quoted">`);
  });

  it("escapes XML-sensitive characters in the eyebrow", () => {
    const svg = buildOgSvg({
      eyebrow: `a & b`,
      subtitle: "subtitle",
      accent: "sky",
    });
    expect(svg).toContain("A &amp; B");
  });
});
